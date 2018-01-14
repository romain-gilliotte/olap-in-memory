
import {Dimension} from './dimension';

export default class Cube {

	get storeSize() {
		return this.dimensions.reduce((m, d) => m * d.numItems, 1);
	}

	constructor(dimensions) {
		// FIXME check that dimensions are valid.

		this.dimensions = dimensions;
		this.storedMeasures = {};
		this.computedMeasures = {};
	}

	createComputedMeasure(measureId, formula) {
		if (this.storedMeasures[measureId] !== undefined || this.computedMeasures[measureId] !== undefined)
			throw new Error('This measure already exists');

		this.computedMeasures[measureId] = formula;
	}

	createStoredMeasure(measureId, defaultValue=0, type='int32') {
		if (this.storedMeasures[measureId] !== undefined || this.computedMeasures[measureId] !== undefined)
			throw new Error('This measure already exists');

		let store = do {
			if (!type || type == 'int32') new Int32Array(this.storeSize);
			else if (type == 'uint32') new UInt32Array(this.storeSize);
			else throw new Error('Invalid type');
		};

		store.fill(defaultValue);

		this.storedMeasures[measureId] = store;
	}

	dropMeasure(measureId) {
		if (this.storedMeasures[measureId] !== undefined)
			delete this.storedMeasures[measureId];

		else if (this.computedMeasures[measureId] !== undefined)
			delete this.computedMeasures[measureId];

		else
			throw new Error('No such measure');
	}

	getFlatArray(measureId) {
		if (this.storedMeasures[measureId] !== undefined)
			return Array.from(this.storedMeasures[measureId]);

		else if (this.computedMeasures[measureId] !== undefined) {
			// Cache prereqs.
			const
				storedMeasuresIds = Object.keys(this.storedMeasures),
				numStoredMeasures = storedMeasuresIds.length,
				numValues = this.storeSize;

			// Create function to compute
			const fn = new Function(
				...storedMeasuresIds,
				'return ' + this.computedMeasures[measureId]
			);

			// Fill result array
			const result = new Array(numValues);
			const params = new Array(numStoredMeasures);
			for (let i = 0; i < numValues; ++i) {
				for (let j = 0; j < numStoredMeasures; ++j)
					params[j] = this.storedMeasures[storedMeasuresIds[j]][i];

				result[i] = fn(...params);
			}

			return result;
		}

		else
			throw new Error('No such measure');
	}

	setFlatArray(measureId, value) {
		const length = this.storeSize;
		const store = this.storedMeasures[measureId];

		if (store === undefined)
			throw new Error('setFlatArray can only be called on stored measures');

		if (length !== value.length)
			throw new Error('value length is invalid');

		for (let i = 0; i < length; ++i)
			store[i] = value[i];
	}

	getNestedArray(measureId) {
		let values = this.getFlatArray(measureId);

		// numDimensions == 0
		if (this.dimensions.length === 0)
			return values[0];

		// numDimensions >= 1
		const numSteps = this.dimensions.length - 1;
		for (let i = this.dimensions.length - 1; i > 0; --i) {
			let chunkSize = this.dimensions[i].numItems;

			let newValues = new Array(values.length / chunkSize);
			for (let j = 0; j < newValues.length; ++j)
				newValues[j] = values.slice(
					j * chunkSize,
					j * chunkSize + chunkSize
				);

			values = newValues;
		}

		return values;
	}

	setNestedArray(measureId, values) {
		const numSteps = this.dimensions.length - 1;

		for (let i = 0; i < numSteps; ++i)
			values = [].concat(...values);

		this.setFlatArray(measureId, values);
	}

	getNestedObject(measureId) {
		let values = this.getFlatArray(measureId);

		// numDimensions == 0
		if (this.dimensions.length === 0)
			return values[0];

		// numDimensions >= 1
		const numSteps = this.dimensions.length - 1;
		for (let i = this.dimensions.length - 1; i >= 0; --i) {
			let chunkSize = this.dimensions[i].numItems;

			let newValues = new Array(values.length / chunkSize);
			for (let j = 0; j < newValues.length; ++j) {
				newValues[j] = {};
				let k = 0;
				for (let dimensionItem of this.dimensions[i].items) {
					newValues[j][dimensionItem.id] = values[j * chunkSize + k];
					k++;
				}
			}

			values = newValues;
		}

		return values[0];
	}

	setNestedObject(measureId, value) {

	}

	slice(dimensionId, value) {
		let dimIndex = this.dimensions.findIndex(d => d.id === dimensionId);
		if (dimIndex === -1)
			throw new Error('No such dimension.');

		const newCube = this.dice(dimensionId, [value]); // dice only one value
		newCube.dimensions.splice(dimIndex, 1); // remove extra dimension
		return newCube;
	}

	dice(dimensionId, values, reorder=false) {
		// Retrieve dimension that we want to change
		let dimIndex = this.dimensions.findIndex(d => d.id === dimensionId || d.hasGroup(dimensionId));
		if (dimIndex === -1)
			throw new Error('No such dimension or group.');

		// Compute index mapping for this dimension so that: oldIndex = itemIndexes[newIndex]
		let itemIndexes;
		if (this.dimensions[dimIndex].id === dimensionId) {
			// we found the dimension directly
			if (reorder)
				itemIndexes = values.map(value => {
					let itemIndex = this.dimensions[dimIndex].items.findIndex(i => i.id === value);
					if (itemIndex === -1)
						throw new Error('No such item');
					return itemIndex;
				});
			else
				itemIndexes = this.dimensions[dimIndex].items
					.map((item, index) => values.indexOf(item.id) !== -1 ? index : null)
					.filter(i => i !== null);
		}
		else {
			// Dice by group value
			if (reorder)
				throw new Error('Reordering is not allowed when using groups'); // because it does not make sense.
			else
				itemIndexes = this.dimensions[dimIndex].items
					.map((item, index) => values.indexOf(item.getParentItem(dimensionId).id) !== -1 ? index : null)
					.filter(i => i !== null);
		}

		const newDimensions = this.dimensions.slice();
		newDimensions[dimIndex] = new Dimension(
			newDimensions[dimIndex].id,
			itemIndexes.map(i => newDimensions[dimIndex].items[i])
		);

		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);

		for (let storedMeasureId in this.storedMeasures) {
			let oldStore = this.storedMeasures[storedMeasureId],
				newStore = new oldStore.constructor(newCube.storeSize);

			let newDimensionIndex = new Array(newCube.dimensions.length);

			for (let newIndex = 0; newIndex < newStore.length; ++newIndex) {
				// Decompose new index into dimensions indexes
				let newIndexCopy = newIndex;
				for (let i = newDimensionIndex.length - 1; i >= 0; --i) {
					newDimensionIndex[i] = newIndexCopy % newCube.dimensions[i].numItems;
					newIndexCopy = Math.floor(newIndexCopy / newCube.dimensions[i].numItems);
				}

				// Compute index where to find this data in old store
				let oldIndex = 0;
				for (let i = 0; i < this.dimensions.length; ++i) {
					let offset = do {
						if (i == dimIndex) itemIndexes[newDimensionIndex[i]];
						else newDimensionIndex[i];
					}

					oldIndex = oldIndex * this.dimensions[i].numItems + offset;
				}

				// Copy value
				newStore[newIndex] = oldStore[oldIndex];
			}

			newCube.storedMeasures[storedMeasureId] = newStore;
		}

		return newCube;
	}

	addDimension(dimension) {
		if (dimension.numItems !== 1)
			throw new Error('invalid')

		this.dimensions.push(dimension);
	}

	removeDimension(dimensionId, opByMeasure={}) {
		// Retrieve dimension that we want to change
		let dimIndex = this.dimensions.findIndex(d => d.id === dimensionId || d.hasGroup(dimensionId));
		if (dimIndex === -1)
			throw new Error('No such dimension or group.');

		const newDimensions = this.dimensions.filter(d => d.id !== dimensionId);
		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);

		for (let storedMeasureId in this.storedMeasures) {
			let oldStore = this.storedMeasures[storedMeasureId],
				newStore = new oldStore.constructor(newCube.storeSize);

			let method = opByMeasure[storedMeasureId] || opByMeasure.default || 'sum';

			let newDimensionIndex = new Array(newCube.dimensions.length);
			for (let newIndex = 0; newIndex < newStore.length; ++newIndex) {
				// Decompose new index into dimensions indexes
				let newIndexCopy = newIndex;
				for (let i = newDimensionIndex.length - 1; i >= 0; --i) {
					newDimensionIndex[i] = newIndexCopy % newCube.dimensions[i].numItems;
					newIndexCopy = Math.floor(newIndexCopy / newCube.dimensions[i].numItems);
				}

				let value;
				if (method == 'first' || method == 'last') {
					let oldIndex = 0;
					for (let j = 0; j < this.dimensions.length; ++j) {
						let offset = do {
							if (j < dimIndex) newDimensionIndex[j];
							else if (j == dimIndex) method == 'first' ? 0 : this.dimensions[dimIndex].numItems - 1;
							else newDimensionIndex[j - 1];
						};

						oldIndex = oldIndex * this.dimensions[j].numItems + offset;
					}

					value = oldStore[oldIndex];
				}
				else if (method == 'sum' || method == 'average' || method == 'highest' || method == 'lowest') {
					value = do {
						if (method == 'highest') -Number.MAX_VALUE
						else if (method == 'lowest') Number.MAX_VALUE
						else 0
					};

					for (let i = 0; i < this.dimensions[dimIndex].numItems; ++i) {
						let oldIndex = 0;
						for (let j = 0; j < this.dimensions.length; ++j) {
							let offset = do {
								if (j < dimIndex) newDimensionIndex[j];
								else if (j == dimIndex) i;
								else newDimensionIndex[j - 1];
							};

							oldIndex = oldIndex * this.dimensions[j].numItems + offset;
						}

						value = do {
							if (method == 'highest') value < oldStore[oldIndex] ? oldStore[oldIndex] : value;
							else if (method == 'lowest') value < oldStore[oldIndex] ? value : oldStore[oldIndex];
							else value + oldStore[oldIndex];
						};
					}

					if (method == 'average')
						value /= this.dimensions[dimIndex].numItems;
				}
				else
					throw new Error('invalid method');

				newStore[newIndex] = value;
			}

			newCube.storedMeasures[storedMeasureId] = newStore;
		}

		return newCube;
	}

	/**
	 * Aggregate a dimension by group values.
	 * ie: minutes by hour, or cities by region.
	 */
	drillUp(groupId, opByMeasureDimension={}) {

	}

	/**
	 * Create a new cube that contains
	 * - the union of the measures
	 * - the intersection of the dimensions
	 * - the intersection of the dimensions items
	 *
	 * This is useful when creating computed measures.
	 */
	compose(otherCube, opByMeasureDimension={default:{}}) {

	}

	/**
	 * Create a new cube that contains
	 * - the intersection of the measures
	 * - the intersection of the dimensions
	 * - the union of the dimensions items
	 *
	 * This is useful when joining many cubes that have the same structure.
	 */
	merge(otherCube, opByMeasureDimension={default:{}}) {

	}

}




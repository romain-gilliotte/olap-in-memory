const DimensionFactory = require('./dimension/factory');
const { toBuffer, fromBuffer } = require('./serialization');


class Cube {

	get storeSize() {
		return this.dimensions.reduce((m, d) => m * d.numItems, 1);
	}

	get byteLength() {
		return Object
			.values(this.storedMeasures)
			.reduce((m, buffer) => m + buffer.byteLength, 0);
	}

	get dimensionIds() {
		return this.dimensions.map(d => d.id);
	}

	get storedMeasureIds() {
		return Object.keys(this.storedMeasures);
	}

	get computedMeasureIds() {
		return Object.keys(this.computedMeasures);
	}

	constructor(dimensions) {
		this.dimensions = dimensions;
		this.storedMeasures = {};
		this.storedMeasuresRules = {};
		this.computedMeasures = {};
	}

	getDimension(dimensionId) {
		return this.dimensions.find(d => d.id === dimensionId);
	}

	getDimensionIndex(dimensionId) {
		return this.dimensions.findIndex(d => d.id === dimensionId);
	}

	createComputedMeasure(measureId, formula) {
		if (this.storedMeasures[measureId] !== undefined || this.computedMeasures[measureId] !== undefined)
			throw new Error('This measure already exists');

		this.computedMeasures[measureId] = formula;
	}

	createStoredMeasure(measureId, aggregation = {}, defaultValue = NaN, type = 'float32') {
		if (this.storedMeasures[measureId] !== undefined || this.computedMeasures[measureId] !== undefined)
			throw new Error('This measure already exists');

		let store;
		if (type == 'int32') store = new Int32Array(this.storeSize);
		else if (type == 'uint32') store = new UInt32Array(this.storeSize);
		else if (type == 'float32') store = new Float32Array(this.storeSize);
		else if (type == 'float64') store = new Float64Array(this.storeSize);
		else throw new Error('Invalid type');

		store.fill(defaultValue);

		this.storedMeasures[measureId] = store;
		this.storedMeasuresRules[measureId] = aggregation
	}

	renameMeasure(oldMeasureId, newMeasureId) {
		const cube = new Cube(this.dimensions);
		cube.storedMeasures = Object.assign({}, this.storedMeasures);
		cube.storedMeasuresRules = Object.assign({}, this.storedMeasuresRules);
		cube.computedMeasures = Object.assign({}, this.computedMeasures);

		if (cube.computedMeasures[oldMeasureId]) {
			cube.computedMeasures[newMeasureId] = cube.computedMeasures[oldMeasureId];
			delete cube.computedMeasures[oldMeasureId];
		}
		else if (cube.storedMeasures[oldMeasureId]) {
			cube.storedMeasures[newMeasureId] = cube.storedMeasures[oldMeasureId];
			cube.storedMeasuresRules[newMeasureId] = cube.storedMeasuresRules[oldMeasureId];
			delete cube.storedMeasures[oldMeasureId];
			delete cube.storedMeasuresRules[oldMeasureId];

			for (let measureId in cube.computedMeasures) {
				cube.computedMeasures[measureId] = cube.computedMeasures[measureId].replace(
					new RegExp(oldMeasureId, 'g'),
					newMeasureId
				);
			}
		}
		else {
			throw new Error('No such measure');
		}

		return cube;
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
			// Create function to compute
			const fn = new Function(
				...this.storedMeasureIds,
				'return ' + this.computedMeasures[measureId]
			);

			// Fill result array
			const result = new Array(this.storeSize);
			const params = new Array(this.storedMeasureIds.length);
			for (let i = 0; i < this.storeSize; ++i) {
				let j = 0;
				for (let storedMeasureId in this.storedMeasures) {
					params[j] = this.storedMeasures[storedMeasureId][i];
					j++;
				}

				result[i] = fn(...params);
			}

			return result;
		}

		else
			throw new Error('No such measure');
	}

	setFlatArray(measureId, value) {
		const store = this.storedMeasures[measureId];

		if (store === undefined)
			throw new Error('setFlatArray can only be called on stored measures');

		if (this.storeSize !== value.length)
			throw new Error('value length is invalid');

		for (let i = 0; i < this.storeSize; ++i)
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
		for (let i = this.dimensions.length - 1; i >= 0; --i) {
			let chunkSize = this.dimensions[i].numItems;

			let newValues = new Array(values.length / chunkSize);
			for (let j = 0; j < newValues.length; ++j) {
				newValues[j] = {};
				let k = 0;
				for (let item of this.dimensions[i].getItems()) {
					newValues[j][item] = values[j * chunkSize + k];
					k++;
				}
			}

			values = newValues;
		}

		return values[0];
	}

	setNestedObject(measureId, value) {
		value = [value];

		for (let i = 0; i < this.dimensions.length; ++i) {
			let dimItems = this.dimensions[i].getItems(),
				newValue = new Array(value.length * this.dimensions[i].numItems);

			for (let j = 0; j < newValue.length; ++j) {
				let chunkIndex = Math.floor(j / dimItems.length),
					dimItem = dimItems[j % dimItems.length];

				newValue[j] = value[chunkIndex][dimItem];
			}

			value = newValue;
		}

		this.setFlatArray(measureId, value);
	}

	hydrateFromSparseNestedObject(measureId, obj, offset = 0, dimOffset = 0) {
		if (dimOffset === this.dimensions.length) {
			this.storedMeasures[measureId][offset] = obj;
			return;
		}

		const dimension = this.dimensions[dimOffset];
		for (let key in obj) {
			const itemOffset = dimension.getItems().indexOf(key);
			if (itemOffset !== -1) {
				const newOffset = offset * dimension.numItems + itemOffset;
				this.hydrateFromSparseNestedObject(measureId, obj[key], newOffset, dimOffset + 1);
			}
		}
	}

	hydrateFromCube(otherCube, allowDrillDown = true, interpolateData = true) {
		// Remove all dimensions which are not in our cube.
		const commonDimensionIds = this.dimensionIds.filter(id => otherCube.dimensionIds.includes(id));
		otherCube = otherCube.keepDimensions(commonDimensionIds);

		// Add missing dimensions
		this.dimensions.forEach(dimension => {
			const otherDimension = otherCube.getDimension(dimension.id);

			if (!otherDimension) {
				const aggregation = {};
				for (let measureId in this.storedMeasuresRules)
					aggregation[measureId] = this.storedMeasuresRules[measureId][dimension.id];

				if (interpolateData) {
					otherCube = otherCube.addDimension(dimension, aggregation);
				} else {
					const newDimension = dimension.dice(dimension.id, dimension.rootAttribute, dimension.getItems()[0]);
					otherCube = otherCube.addDimension(newDimension, aggregation);
				}
			}
		});

		// Reorder dimensions
		otherCube = otherCube.reorderDimensions(this.dimensionIds);

		// Drillup/drilldown so that the attributes are the same.
		this.dimensions.forEach((dimension, dimIndex) => {
			const otherDimension = otherCube.getDimension(dimension.id);

			if (otherDimension.rootAttribute !== dimension.rootAttribute) {
				if (otherDimension.attributes.includes(dimension.rootAttribute))
					otherCube = otherCube.drillUp(dimension.id, dimension.rootAttribute);
				else if (allowDrillDown) {
					// when drilling down the cube which will provide data, dice it to ensure that all
					// fields have somewhere to go.
					// this could be a separated step.
					const drillDim = dimension.dice(otherDimension.rootAttribute, otherDimension.getItems())
					otherCube = otherCube._drillDown(dimIndex, drillDim);
				}
				else
					throw new Error('the cubes are not compatible')
			}
		});

		// Fill our cube
		for (let measureId in this.storedMeasures) {
			if (otherCube.storedMeasures[measureId]) {
				this.hydrateFromSparseNestedObject(
					measureId,
					otherCube.getNestedObject(measureId)
				);
			}
		}
	}

	project(dimensionIds) {
		return this.keepDimensions(dimensionIds).reorderDimensions(dimensionIds);
	}

	reorderDimensions(dimensionIds) {
		// FIXME the variable naming in this function is very unclear

		const
			numDimensions = this.dimensions.length,
			dimensionsIndexes = dimensionIds.map(dimId => this.dimensionIds.indexOf(dimId)),
			dimensions = dimensionsIndexes.map(dimIndex => this.dimensions[dimIndex]),
			newCube = new Cube(dimensions);

		Object.assign(newCube.computedMeasures, this.computedMeasures);
		Object.assign(newCube.storedMeasuresRules, this.storedMeasuresRules);

		for (let storedMeasureId in this.storedMeasures)
			newCube.createStoredMeasure(storedMeasureId);

		const newDimensionIndex = new Array(numDimensions);
		for (let newIndex = 0; newIndex < this.storeSize; ++newIndex) {
			// Decompose new index into dimensions indexes
			let newIndexCopy = newIndex;
			for (let i = numDimensions - 1; i >= 0; --i) {
				newDimensionIndex[i] = newIndexCopy % newCube.dimensions[i].numItems;
				newIndexCopy = Math.floor(newIndexCopy / newCube.dimensions[i].numItems);
			}

			// Compute what the old index was
			let oldIndex = 0;
			for (let i = 0; i < numDimensions; ++i) {
				let oldDimIndex = dimensionsIndexes[i];
				oldIndex = oldIndex * this.dimensions[i].numItems + newDimensionIndex[oldDimIndex];
			}

			for (let storedMeasureId in this.storedMeasures)
				newCube.storedMeasures[storedMeasureId][newIndex] = this.storedMeasures[storedMeasureId][oldIndex];
		}

		return newCube;
	}

	slice(dimensionId, attribute, value) {
		let dimIndex = this.getDimensionIndex(dimensionId);
		if (dimIndex === -1)
			throw new Error('No such dimension.');

		if (this.dimensions[dimIndex].rootAttribute !== attribute)
			throw new Error('Slice only allowed on root attribute.');

		const newCube = this.dice(dimensionId, attribute, [value]); // dice only one value
		newCube.dimensions.splice(dimIndex, 1); // remove extra dimension
		return newCube;
	}

	diceRange(dimensionId, attribute, start, end) {
		// Retrieve dimension that we want to change
		let dimIndex = this.getDimensionIndex(dimensionId);
		if (dimIndex === -1)
			throw new Error('No such dimension.');

		let oldDimension = this.dimensions[dimIndex],
			newDimension = oldDimension.diceRange(attribute, start, end);

		return this._dice(dimIndex, newDimension);
	}

	dice(dimensionId, attribute, values, reorder = false) {
		// Retrieve dimension that we want to change
		let dimIndex = this.getDimensionIndex(dimensionId);
		if (dimIndex === -1)
			throw new Error('No such dimension.');

		let oldDimension = this.dimensions[dimIndex],
			newDimension = oldDimension.dice(attribute, values, reorder);

		return this._dice(dimIndex, newDimension);
	}

	_dice(dimIndex, newDimension) {
		const oldDimension = this.dimensions[dimIndex];
		const newDimensions = this.dimensions.slice();
		newDimensions[dimIndex] = newDimension;

		let itemIndexes = newDimension
			.getItems()
			.map(item => oldDimension.getItems().indexOf(item))
			.filter(index => index !== -1);

		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);
		Object.assign(newCube.storedMeasuresRules, this.storedMeasuresRules);

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
					let offset;
					if (i == dimIndex) offset = itemIndexes[newDimensionIndex[i]];
					else offset = newDimensionIndex[i];

					oldIndex = oldIndex * this.dimensions[i].numItems + offset;
				}

				// Copy value
				newStore[newIndex] = oldStore[oldIndex];
			}

			newCube.storedMeasures[storedMeasureId] = newStore;
		}

		return newCube;
	}

	keepDimensions(dimensionIds) {
		return this.removeDimensions(
			this.dimensionIds.filter(dimId => dimensionIds.indexOf(dimId) === -1)
		);
	}

	removeDimensions(dimensionIds) {
		let cube = this;

		for (let dimensionId of dimensionIds)
			cube = cube.removeDimension(dimensionId);

		return cube;
	}

	addDimension(dimension, aggregation = {}) {
		const clone = new Cube([...this.dimensions]);
		Object.assign(clone.computedMeasures, this.computedMeasures);
		Object.assign(clone.storedMeasures, this.storedMeasures);

		clone.storedMeasuresRules = JSON.parse(JSON.stringify(this.storedMeasuresRules));
		for (let measureId in aggregation)
			clone.storedMeasuresRules[measureId][dimension.id] = aggregation[measureId];

		// If length == 1, we are done
		if (dimension.length === 1) {
			clone.dimensions.push(dimension);
			return clone;
		}

		// In the general case, we'll trick the cube in thinking it is drillingDown.
		clone.dimensions.push({ id: dimension.id, rootAttribute: 'global', drillDown: () => dimension, numItems: 1 })

		// Cheat by overriding getChildIndex to make the drillDown possible
		dimension.getChildIndex = () => 0;
		const finalCube = clone.drillDown(dimension.id, dimension.rootAttribute, true);
		delete dimension.getChildIndex;

		return finalCube;
	}

	removeDimension(dimensionId) {
		// Retrieve dimension that we want to change
		let dimensionToRemove = this.getDimension(dimensionId),
			dimIndex = this.dimensions.indexOf(dimensionToRemove);

		if (dimIndex === -1)
			throw new Error(`No dimension named "${dimensionId}" was found.`);

		const newDimensions = this.dimensions.filter(d => d.id !== dimensionId);
		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);

		for (let storedMeasureId in this.storedMeasures) {
			let oldStore = this.storedMeasures[storedMeasureId],
				newStore = new oldStore.constructor(newCube.storeSize);

			let method = this.storedMeasuresRules[storedMeasureId][dimensionId] || 'sum';

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
						let offset;
						if (j < dimIndex) offset = newDimensionIndex[j];
						else if (j == dimIndex) offset = method == 'first' ? 0 : dimensionToRemove.numItems - 1;
						else offset = newDimensionIndex[j - 1];

						oldIndex = oldIndex * this.dimensions[j].numItems + offset;
					}

					value = oldStore[oldIndex];
				}
				else if (method == 'sum' || method == 'average' || method == 'highest' || method == 'lowest') {
					if (method == 'highest') value = -Number.MAX_VALUE
					else if (method == 'lowest') value = Number.MAX_VALUE
					else value = 0

					for (let i = 0; i < dimensionToRemove.numItems; ++i) {
						let oldIndex = 0;
						for (let j = 0; j < this.dimensions.length; ++j) {
							let offset;
							if (j < dimIndex) offset = newDimensionIndex[j];
							else if (j == dimIndex) offset = i;
							else offset = newDimensionIndex[j - 1];

							oldIndex = oldIndex * this.dimensions[j].numItems + offset;
						}

						if (method == 'highest') value = value < oldStore[oldIndex] ? oldStore[oldIndex] : value;
						else if (method == 'lowest') value = value < oldStore[oldIndex] ? value : oldStore[oldIndex];
						else value = value + oldStore[oldIndex];
					}

					if (method == 'average')
						value /= dimensionToRemove.numItems;
				}
				else
					throw new Error('invalid method');

				newStore[newIndex] = value;
			}

			newCube.storedMeasures[storedMeasureId] = newStore;
			newCube.storedMeasuresRules[storedMeasureId] = {};
			for (let dimIndex = 0; dimIndex < newCube.dimensions.length; ++dimIndex) {
				const dimension = newCube.dimensions[dimIndex];
				newCube.storedMeasuresRules[storedMeasureId][dimension.id] = this.storedMeasuresRules[storedMeasureId][dimension.id];
			}
		}

		return newCube;
	}

	drillDown(dimensionId, attribute, useRounding = true) {
		const dimIndex = this.getDimensionIndex(dimensionId);
		const oldDimension = this.dimensions[dimIndex];
		if (oldDimension.rootAttribute === attribute) {
			return this;
		}

		const newDimension = oldDimension.drillDown(attribute);
		return this._drillDown(dimIndex, newDimension, useRounding)
	}

	_drillDown(dimIndex, newDimension, useRounding = true) {
		const oldDimension = this.dimensions[dimIndex];
		const dimensionId = oldDimension.id;
		const newDimensions = this.dimensions.slice();
		newDimensions[dimIndex] = newDimension;

		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);
		Object.assign(newCube.storedMeasuresRules, this.storedMeasuresRules);

		let newDimensionIndex = new Uint32Array(this.dimensions.length);

		for (let storedMeasureId in this.storedMeasures) {
			const oldStore = this.storedMeasures[storedMeasureId];
			const newToOldIndexMap = new Uint32Array(newCube.storeSize);
			const contributions = new Uint32Array(this.storeSize);

			for (let newIndex = 0; newIndex < newToOldIndexMap.length; ++newIndex) {
				// Decompose new index into dimensions indexes
				let newIndexCopy = newIndex;
				for (let i = newDimensionIndex.length - 1; i >= 0; --i) {
					newDimensionIndex[i] = newIndexCopy % newCube.dimensions[i].numItems;
					newIndexCopy = Math.floor(newIndexCopy / newCube.dimensions[i].numItems);
				}

				// Compute corresponding old index
				let oldIndex = 0;
				for (let j = 0; j < this.dimensions.length; ++j) {
					let offset;

					if (j == dimIndex) offset = newCube.dimensions[j].getChildIndex(oldDimension.rootAttribute, newDimensionIndex[j])
					else offset = newDimensionIndex[j];

					oldIndex = oldIndex * this.dimensions[j].numItems + offset;
				}

				// Depending on aggregation method, copy value.
				newToOldIndexMap[newIndex] = oldIndex;
				contributions[oldIndex] += 1;
			}

			const method = this.storedMeasuresRules[storedMeasureId][dimensionId] || 'sum';
			const newStore = new oldStore.constructor(newCube.storeSize);
			const contributionsIds = new Uint32Array(this.storeSize);

			for (let newIndex = 0; newIndex < newToOldIndexMap.length; ++newIndex) {
				const oldIndex = newToOldIndexMap[newIndex];
				if (method === 'sum') {
					if (useRounding) {
						const value = Math.floor(oldStore[oldIndex] / contributions[oldIndex]);
						const remainder = oldStore[oldIndex] % contributions[oldIndex];
						const contributionId = contributionsIds[oldIndex];
						const oneOverDistance = remainder / contributions[oldIndex];
						const lastIsSame = Math.floor(contributionId * oneOverDistance) === Math.floor((contributionId - 1) * oneOverDistance);

						newStore[newIndex] = Math.floor(value);
						if (!lastIsSame)
							newStore[newIndex]++;
					}
					else {
						newStore[newIndex] = oldStore[oldIndex] / contributions[oldIndex];
					}
				}
				else
					newStore[newIndex] = oldStore[oldIndex];

				contributionsIds[oldIndex]++;
			}

			newCube.storedMeasures[storedMeasureId] = newStore;
		}

		return newCube;
	}


	/**
	 * Aggregate a dimension by group values.
	 * ie: minutes by hour, or cities by region.
	 */
	drillUp(dimensionId, attribute) {
		const STRANGE_VALUE = 28763;
		const dimIndex = this.getDimensionIndex(dimensionId);
		const oldDimension = this.dimensions[dimIndex];
		if (oldDimension.rootAttribute === attribute) {
			// drilling up to current dimension will yield the same cube.
			return this;
		}

		const newDimension = oldDimension.drillUp(attribute);
		const newDimensions = this.dimensions.slice();
		newDimensions.splice(dimIndex, 1, newDimension);

		const newCube = new Cube(newDimensions);
		Object.assign(newCube.computedMeasures, this.computedMeasures);
		Object.assign(newCube.storedMeasuresRules, this.storedMeasuresRules);

		let oldDimensionIndex = new Array(this.dimensions.length);

		for (let storedMeasureId in this.storedMeasures) {
			let oldStore = this.storedMeasures[storedMeasureId],
				newStore = new oldStore.constructor(newCube.storeSize),
				contributions = new Array(newCube.storeSize);

			newStore.fill(STRANGE_VALUE);
			contributions.fill(0);

			let method = this.storedMeasuresRules[storedMeasureId][dimensionId] || 'sum';

			for (let oldIndex = 0; oldIndex < oldStore.length; ++oldIndex) {
				// Decompose old index into dimensions indexes
				let oldIndexCopy = oldIndex;
				for (let i = oldDimensionIndex.length - 1; i >= 0; --i) {
					oldDimensionIndex[i] = oldIndexCopy % this.dimensions[i].numItems;
					oldIndexCopy = Math.floor(oldIndexCopy / this.dimensions[i].numItems);
				}

				let newIndex = 0;
				for (let j = 0; j < newCube.dimensions.length; ++j) {
					let offset;
					if (j == dimIndex) offset = this.dimensions[j].getChildIndex(attribute, oldDimensionIndex[j])
					else offset = oldDimensionIndex[j];

					newIndex = newIndex * newCube.dimensions[j].numItems + offset;
				}

				if (newStore[newIndex] == STRANGE_VALUE)
					newStore[newIndex] = oldStore[oldIndex];
				else {
					if (method == 'last')
						newStore[newIndex] = oldStore[oldIndex];
					else if (method == 'highest')
						newStore[newIndex] = newStore[newIndex] < oldStore[oldIndex] ? oldStore[oldIndex] : newStore[newIndex];
					else if (method == 'lowest')
						newStore[newIndex] = newStore[newIndex] < oldStore[oldIndex] ? newStore[newIndex] : oldStore[oldIndex];
					else
						newStore[newIndex] += oldStore[oldIndex];
				}

				contributions[newIndex] += 1;
			}

			if (method === 'average')
				for (let newIndex = 0; newIndex < newStore.length; ++newIndex)
					newStore[newIndex] /= contributions[newIndex];

			newCube.storedMeasures[storedMeasureId] = newStore;
		}

		return newCube;
	}

	/**
	 * Create a new cube that contains
	 * - the union of the measures
	 * - the intersection of the dimensions
	 * - the intersection of the dimensions items
	 *
	 * Cubes will drillUp if necessary so that the dimensions are compatible.
	 *
	 * This is useful when we want to create computed measures from different sources.
	 * For instance, composing a cube with sells by day, and number of open hour per week,
	 * to compute average sell by opening hour per week.
	 */
	compose(otherCube) {
		let dimensionIds = this.dimensionIds.filter(dimId => otherCube.dimensionIds.indexOf(dimId) !== -1),
			cube1 = this.keepDimensions(dimensionIds),
			cube2 = otherCube.keepDimensions(dimensionIds).reorderDimensions(dimensionIds);

		for (let i = 0; i < dimensionIds.length; ++i) {
			const dimension1 = cube1.dimensions[i];
			const dimension2 = cube2.dimensions[i];
			const newDimension = dimension1.intersect(dimension2);

			cube1 = cube1.drillUp(newDimension.id, newDimension.rootAttribute)._dice(i, newDimension);
			cube2 = cube2.drillUp(newDimension.id, newDimension.rootAttribute)._dice(i, newDimension);
		}

		// At this point, cube1 and cube2 should have exactly the same format, we can merge them.
		let newCube = new Cube(cube1.dimensions);
		Object.assign(newCube.computedMeasures, cube1.computedMeasures, cube2.computedMeasures);
		Object.assign(newCube.storedMeasures, cube1.storedMeasures, cube2.storedMeasures);
		Object.assign(newCube.storedMeasuresRules, cube1.storedMeasuresRules, cube2.storedMeasuresRules);

		return newCube;
	}

	serialize() {
		return toBuffer({
			dimensions: this.dimensions.map(dim => dim.serialize()),
			storedMeasures: this.storedMeasures,
			storedMeasuresRules: this.storedMeasuresRules,
			computedMeasures: this.computedMeasures
		});
	}

	static deserialize(buffer) {
		const data = fromBuffer(buffer);
		const dimensions = data.dimensions.map(dimData => DimensionFactory.deserialize(dimData));

		const cube = new Cube(dimensions);
		cube.storedMeasures = data.storedMeasures;
		cube.storedMeasuresRules = data.storedMeasuresRules;
		cube.computedMeasures = data.computedMeasures;
		return cube;
	}
}

module.exports = Cube;
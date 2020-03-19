const AbstractDimension = require('./abstract');
const { toBuffer, fromBuffer } = require('../serialization');

class GenericDimension extends AbstractDimension {

	get attributes() {
		return Object.keys(this._attributeMappings);
	}

	/**
	 * Create a simple dimension
	 *
	 * @param  {[type]} dimensionId ie: "location"
	 * @param  {[type]} attribute   ie: "zipCode"
	 * @param  {[type]} items       ie: ["12345", "54321"]
	 */
	constructor(dimensionId, rootAttribute, items) {
		super(dimensionId, rootAttribute);

		// Items for all attributes
		// {
		// 	year: ['2010', '2011', '2012', '2013'],
		// 	parity: ['even', 'odd']
		// }
		this._attributeItems = {};
		this._attributeItems[rootAttribute] = items;

		// Mappings from all attributes to default one
		// {
		// 	year: [0, 1, 2, 3], <- maps to itself
		// 	parity: [0, 1, 0, 1] <- this._attributeMappings.parity[3 ('2012')] == 0 ('even')
		// }
		this._attributeMappings = {};
		this._attributeMappings[rootAttribute] = new Uint32Array(items.map((item, index) => index));

		if (items.length === 0)
			throw new Error('Empty dimensions are not allowed');
	}

	static deserialize(buffer) {
		const data = fromBuffer(buffer);
		const dimension = new GenericDimension(data.id, data.rootAttribute, data.attributeItems[data.rootAttribute]);
		Object.assign(dimension._attributeItems, data.attributeItems);
		Object.assign(dimension._attributeMappings, data.attributeMappings);
		return dimension;
	}

	serialize() {
		return toBuffer({
			id: this.id,
			rootAttribute: this.rootAttribute,
			rootItems: this._attributeItems[this.rootAttribute],
			attributeItems: this._attributeItems,
			attributeMappings: this._attributeMappings
		});
	}

	/**
	 * Add a parent attribute based on an existing one.
	 *
	 * @param {[type]} baseAttribute ie: "zipCode"
	 * @param {[type]} newAttribute  ie: "city"
	 * @param {[type]} mapping       ie: {"12345": "paris", "54321": "paris"}
	 */
	addChildAttribute(parentAttribute, childAttribute, mapping, defaultValue = null) {
		let newItems = [],
			newMappings = new Uint32Array(this.numItems);

		let indexes = {},
			parentItems = this._attributeItems[parentAttribute],
			parentMapping = this._attributeMappings[parentAttribute];

		for (let rootIndex = 0; rootIndex < this.numItems; ++rootIndex) {
			let parentIndex = parentMapping[rootIndex],
				parentItem = parentItems[parentIndex];

			let childItem;
			if (typeof mapping == 'function')
				childItem = mapping(parentItem) || defaultValue;
			else
				childItem = mapping[parentItem] || defaultValue;

			if (typeof childItem !== 'string')
				throw new Error('Mapping result must be a string.');

			if (indexes[childItem] === undefined) {
				indexes[childItem] = newItems.length;
				newItems.push(childItem);
			}

			// childItem == asia
			// index de asia: indexes[childItem] == 1
			// mapping country: [0, 0, 1, 2]

			newMappings[rootIndex] = indexes[childItem];
		}

		this._attributeItems[childAttribute] = newItems;
		this._attributeMappings[childAttribute] = newMappings;
	}

	getItems(attribute = null) {
		return this._attributeItems[attribute || this._rootAttribute];
	}

	drillUp(newAttribute) {
		const
			rootItems = this._attributeItems[this._rootAttribute],
			newItems = this._attributeItems[newAttribute],
			newMapping = this._attributeMappings[newAttribute],
			newDimension = new GenericDimension(this.id, newAttribute, newItems);

		ol: for (let childAttribute of this.attributes) {
			if (childAttribute === newAttribute)
				continue; // Skip current one.

			const
				childItems = this._attributeItems[childAttribute],
				childMapping = this._attributeMappings[childAttribute],
				mapping = {};

			for (let i = 0; i < rootItems.length; ++i) {
				let childItem = childItems[childMapping[i]],
					newItem = newItems[newMapping[i]];

				// Not possible to build this attribute (no clean cut on the graph)
				if (mapping[newItem] && mapping[newItem] !== childItem)
					continue ol;

				mapping[newItem] = childItem;
			}

			newDimension.addChildAttribute(newAttribute, childAttribute, mapping);
		}

		return newDimension;
	}

	dice(attribute, items, reorder = false) {
		let oldItems = this._attributeItems[this._rootAttribute],
			newItems = null;

		if (this.rootAttribute === attribute) {
			// We found the dimension directly
			if (reorder)
				newItems = items;

			else
				newItems = oldItems.filter(i => items.indexOf(i) !== -1);
		}
		else {
			// Dice by group value
			if (reorder)
				// because it does not make sense.
				throw new Error('Reordering is not allowed when using groups');
			else
				newItems = oldItems.filter(i => items.indexOf(this.getChildItem(attribute, i)) !== -1);
		}

		let dimension = new GenericDimension(this.id, this.rootAttribute, newItems);
		for (let attribute of this.attributes)
			if (attribute !== this._rootAttribute)
				dimension.addChildAttribute(this._rootAttribute, attribute, i => this.getChildItem(attribute, i));

		return dimension;
	}

	diceRange(attribute, start, end) {
		throw new Error('Unsupported');
	}

	/**
	 *
	 * @param  {[type]} attribute eg: 'month'
	 * @param  {[type]} value     '2010-01-01'
	 * @return {[type]}           '2010-01'
	 */
	getChildItem(attribute, value) {
		const valueIndex = this._attributeItems[this._rootAttribute].indexOf(value);
		if (valueIndex === -1) {
			throw new Error(`No item "${value}" was found on attribute ${this._rootAttribute} of dimension ${this.id}`);
		}

		if (this._attributeMappings[attribute]) {
			const childValueIndex = this._attributeMappings[attribute][valueIndex];
			return this._attributeItems[attribute][childValueIndex];
		}
		else {
			throw new Error(`No attribute ${attribute} was found on dimension ${this.id}`);
		}
	}

	/**
	 *
	 * @param  {[type]} attribute eg: month
	 * @param  {[type]} index     32
	 * @return {[type]}           2
	 */
	getChildIndex(attribute, index) {
		if (this._attributeMappings[attribute]) {
			return this._attributeMappings[attribute][index];
		}
		else {
			throw new Error(`No attribute ${attribute} was found on dimension ${this.id}`);
		}
	}

	intersect(otherDimension) {
		if (this.id !== otherDimension.id) {
			throw new Error('not the same dimension');
		}

		let rootAttribute;
		if (this.attributes.includes(otherDimension.rootAttribute))
			rootAttribute = otherDimension.rootAttribute;
		else if (otherDimension.attributes.includes(this.rootAttribute))
			rootAttribute = this.rootAttribute;
		else
			throw new Error(`The dimensions are not compatible`);

		const otherItems = otherDimension.getItems(rootAttribute);
		const commonItems = this.getItems(rootAttribute).filter(i => otherItems.includes(i));

		return this.drillUp(rootAttribute).dice(rootAttribute, commonItems);
	}
}

module.exports = GenericDimension;

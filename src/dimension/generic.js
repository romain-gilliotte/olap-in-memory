
class Dimension {

	get numItems() {
		return this._attributeItems[this._rootAttribute].length;
	}

	get rootAttribute() {
		return this._rootAttribute;
	}

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
		this.id = dimensionId;
		this._rootAttribute = rootAttribute;

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
		this._attributeMappings[rootAttribute] = items.map((item, index) => index);
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
			newMappings = new Array(this.numItems);

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
			newDimension = new Dimension(this.id, newAttribute, newItems);

		ol: for (let childAttribute of this.attributes) {
			if (childAttribute === newAttribute)
				continue; // Skip current one.

			const
				childItems = this._attributeItems[childAttribute],
				childMapping = this._attributeMappings[childAttribute],
				mapping = {};

			for (let i = 0; i < rootItems.length; ++i) {
				let rootItem = rootItems[i],
					childItem = childItems[childMapping[i]],
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

		let dimension = new Dimension(this.id, this.rootAttribute, newItems);
		for (let attribute of this.attributes)
			if (attribute !== this._rootAttribute)
				dimension.addChildAttribute(this._rootAttribute, attribute, i => this.getChildItem(attribute, i));

		return dimension;
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
}

module.exports = Dimension;

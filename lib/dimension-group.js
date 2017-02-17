"use strict";

import TimeSlot from "./time-slot";

/**
 * A DimensionGroup allows to query cubes on dimension aggregates.
 * For instance, for a cube containing a "date" dimension, then a "month" dimension group can be created.
 */
export default class DimensionGroup {

	static createTime(parent, dimension) {
		// Create DimensionGroup mapping from Dimension items.
		var mapping = {};

		dimension.items.forEach(function(childValue) {
			var parentValue = new TimeSlot(childValue).toUpperSlot(parent).value;

			mapping[parentValue] = mapping[parentValue] || [];
			mapping[parentValue].push(childValue);
		});

		return new DimensionGroup(parent, dimension.id, mapping);
	}

	constructor(id, childDimension, mapping) {
		this.id = id;
		this.childDimension = childDimension;
		this.items = Object.keys(mapping);
		this.mapping = mapping;
	}
}

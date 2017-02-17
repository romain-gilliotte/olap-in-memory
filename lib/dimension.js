"use strict";

export default class Dimension {

	/**
	 * id = "month"
	 * items = ["2010-01", "2010-02", ...]
	 * aggregation = "sum"
	 */
	constructor(id, items, aggregation) {
		this.id = id;
		this.items = items;
		this.aggregation = aggregation;
	}

}

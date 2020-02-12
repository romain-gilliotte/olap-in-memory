
class AbstractDimension {

    get numItems() {
        return this.getItems().length;
    }

    get rootAttribute() {
        return this._rootAttribute;
    }

    get attributes() {
        throw new Error('Override me');
    }

	/**
	 * Create a simple dimension
	 *
	 * @param  {[type]} dimensionId ie: "location"
	 * @param  {[type]} attribute   ie: "zipCode"
	 * @param  {[type]} items       ie: ["12345", "54321"]
	 */
    constructor(dimensionId, rootAttribute) {
        this.id = dimensionId;
        this._rootAttribute = rootAttribute;
    }

    getItems(attribute = null) {
        throw new Error('Override me');
    }

    drillUp(newAttribute) {
        throw new Error('Override me');
    }

    dice(attribute, items, reorder = false) {
        throw new Error('Override me');
    }

	/**
	 *
	 * @param  {[type]} attribute eg: 'month'
	 * @param  {[type]} item     '2010-01-01'
	 * @return {[type]}           '2010-01'
	 */
    getChildItem(attribute, item) {
        throw new Error('Override me');
    }

	/**
	 *
	 * @param  {[type]} attribute eg: month
	 * @param  {[type]} itemIndex 32
	 * @return {[type]}           2
	 */
    getChildIndex(attribute, itemIndex) {
        throw new Error('Override me');
    }

}

module.exports = AbstractDimension;

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

    get label() {
        return this._label;
    }

    get isInterpolated() {
        throw new Error('Override me');
    }

	/**
	 * Create a simple dimension
	 *
	 * @param  {[type]} id         ie: "location"
     * @param  {[type]} attribute  ie: "zipCode"
     * @param  {string} label
	 */
    constructor(id, rootAttribute, label = null, originalRootAttribute = null) {
        this.id = id;
        this._rootAttribute = rootAttribute;
        this._label = label;
        this._originalRootAttribute = originalRootAttribute || rootAttribute;
    }

    getItems(attribute = null) {
        throw new Error('Override me');
    }

    drillUp(newAttribute) {
        throw new Error('Override me');
    }

    drillDown(newAttribute) {
        throw new Error('Override me');
    }

    dice(attribute, items, reorder = false) {
        throw new Error('Override me');
    }

    diceRange(attribute, start, end) {
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
const AbstractDimension = require('./abstract');

class CatchAll extends AbstractDimension {

    get attributes() {
        throw new Error('Unsupported');
    }

	/**
	 * Create a simple dimension
	 */
    constructor(id, childDimension = null) {
        super(id, 'all');
        this.childDimension = childDimension;
    }

    serialize() {
        throw new Error('Unsupported');
    }

    getItems(attribute = null) {
        return ['_total']
    }

    getEntries(attribute = null, language = 'en') {
        return [['_total', 'Total']]
    }

    drillUp(newAttribute) {
        return this;
    }

    drillDown(newAttribute) {
        if (this.childDimension)
            return this.childDimension.drillUp(newAttribute);
        else
            throw new Error('Must set child dimension.');
    }

    dice(attribute, items, reorder = false) {
        if (attribute === this.rootAttribute && items.includes('_total'))
            return this;
        else
            throw new Error('Unsupported');
    }

    diceRange(attribute, start, end) {
        throw new Error('Unsupported');
    }

    /**
     *
     * @param  {[type]} attribute eg: month
     * @param  {[type]} index     32
     * @return {[type]}           2
     */
    getGroupIndexFromRootIndex(attribute, index) {
        return 0;
    }

    intersect(otherDimension) {
        return otherDimension;
    }

    union(otherDimension) {
        return this;
    }
}

module.exports = CatchAll;

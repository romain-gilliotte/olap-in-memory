
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

	/**
	 * Create a simple dimension
	 *
	 * @param  {[type]} id         ie: "location"
     * @param  {[type]} attribute  ie: "zipCode"
     * @param  {string} label
	 */
    constructor(id, rootAttribute, label = null) {
        this.id = id;
        this._rootAttribute = rootAttribute;
        this._label = label;
        this._itemsToIdx = {};
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

    diceRange(attribute, start, end) {
        throw new Error('Override me');
    }

    getRootIndexFromRootItem(rootItem) {
        const rootItemsToIdx = this.getItemsToIdx();
        const result = rootItemsToIdx[rootItem];
        return result === undefined ? -1 : result;
    }

    getGroupIndexFromRootIndex(groupAttr, rootIndex) {
        throw new Error('Override me');
    }

    getItemsToIdx(attribute = null) {
        const attr = attribute || this._rootAttribute

        if (!this._itemsToIdx[attr]) {
            const itemsToIdx = {};
            const items = this.getItems(attr);
            const numItems = items.length;

            for (let i = 0; i < numItems; ++i)
                itemsToIdx[items[i]] = i;

            this._itemsToIdx[attr] = itemsToIdx;
        }

        return this._itemsToIdx[attr];
    }

    getGroupIndexFromRootItem(groupAttr, rootItem) {
        const rootIndex = this.getRootIndexFromRootItem(rootItem);
        return this.getGroupIndexFromRootIndex(groupAttr, rootIndex);
    }

    getGroupItemFromRootIndex(groupAttr, rootIndex) {
        const groupIndex = this.getGroupIndexFromRootIndex(groupAttr, rootIndex);
        const groupItems = this.getItems(groupAttr);
        return groupItems[groupIndex];
    }

    getGroupItemFromRootItem(groupAttr, rootItem) {
        const groupIndex = this.getGroupIndexFromRootItem(groupAttr, rootItem);
        const groupItems = this.getItems(groupAttr);
        return groupItems[groupIndex];
    }

    _checkRootIndex(index) {
        if (index < 0 || index >= this.numItems)
            throw new Error(`rootIndex ${index} out of bounds [0, ${this.numItems}[`);
    }

    _checkAttribute(attribute) {
        if (!this.attributes.includes(attribute))
            throw new Error(`No attribute ${attribute} was found on dimension ${this.id}`);
    }
}

module.exports = AbstractDimension;
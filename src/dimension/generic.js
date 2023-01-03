const AbstractDimension = require('./abstract');
const { toBuffer, fromBuffer } = require('../serialization');

class GenericDimension extends AbstractDimension {
    get attributes() {
        return Object.keys(this._rootIdxToGroupIdx);
    }

    /**
     * Create a simple dimension
     */
    constructor(id, rootAttribute, items, label = null, itemToLabelMap = null) {
        super(id, rootAttribute, label);

        // Items for all attributes
        // {
        // 	year: ['2010', '2011', '2012', '2013'],
        // 	parity: ['even', 'odd']
        // }
        this._items = {};
        this._items['all'] = ['all'];
        this._items[rootAttribute] = items;

        // Mappings from all attributes to default one
        // {
        // 	year: [0, 1, 2, 3], <- maps to itself
        // 	parity: [0, 1, 0, 1] <- this._attributeMappings.parity[3 ('2012')] == 0 ('even')
        // }
        this._rootIdxToGroupIdx = {};
        this._rootIdxToGroupIdx['all'] = new Uint32Array(items.length); // everything points to item 0
        this._rootIdxToGroupIdx[rootAttribute] = new Uint32Array(items.map((item, index) => index));

        // Mapping for labels
        this._itemToLabel = {};
        this._itemToLabel['all'] = { all: 'All' };
        this._itemToLabel[rootAttribute] = {};
        items.forEach(item => {
            this._itemToLabel[rootAttribute][item] = this._getOrCall(itemToLabelMap, item);
        });
    }

    static deserialize(buffer) {
        const data = fromBuffer(buffer);
        const dimension = new GenericDimension(
            data.id,
            data.rootAttribute,
            data.attributeItems[data.rootAttribute],
            data.label
        );
        Object.assign(dimension._items, data.attributeItems);
        Object.assign(dimension._itemToLabel, data.attributeLabels);
        Object.assign(dimension._rootIdxToGroupIdx, data.attributeMappings);

        return dimension;
    }

    serialize() {
        return toBuffer({
            id: this.id,
            label: this.label,
            rootAttribute: this._rootAttribute,
            rootItems: this._items[this._rootAttribute],
            attributeItems: this._items,
            attributeLabels: this._itemToLabel,
            attributeMappings: this._rootIdxToGroupIdx,
        });
    }

    /**
     * Add a parent attribute based on an existing one.
     * If an exception is throw on mapping functions, the dimensions will not be modified.
     *
     * @param {string} baseAttr ie: "zipCode"
     * @param {string} newAttr   ie: "city"
     * @param {Record<string, string> | (string): string} parentToGroup ie: {"12345": "paris", "54321": "paris"}
     * @param {Record<string, string> | (string): string} groupToLabelMap  ie: {'paris': "Ville de Paris"}
     */
    addAttribute(baseAttr, newAttr, baseToNew, newToNewLabel = null) {
        const newItem_to_newIdx = {};

        // Initialize data
        const items = [];
        const rootIdxToGroupIdx = new Uint32Array(this.numItems);
        const itemToLabels = {};

        for (let rootIndex = 0; rootIndex < this.numItems; ++rootIndex) {
            // Convert baseItem to newItem
            const baseIdx = this._rootIdxToGroupIdx[baseAttr][rootIndex];
            const baseItem = this._items[baseAttr][baseIdx];
            const newItem = this._getOrCall(baseToNew, baseItem);
            if (typeof newItem !== 'string') throw new Error('Mapping result must be a string.');

            // Create index, label and push if we see this item for the first time in the mapping table.
            if (newItem_to_newIdx[newItem] === undefined) {
                newItem_to_newIdx[newItem] = items.length;
                items.push(newItem);
                itemToLabels[newItem] = this._getOrCall(newToNewLabel, newItem);
            }

            // Record mapping from root
            rootIdxToGroupIdx[rootIndex] = newItem_to_newIdx[newItem];
        }

        this._items[newAttr] = items;
        this._rootIdxToGroupIdx[newAttr] = rootIdxToGroupIdx;
        this._itemToLabel[newAttr] = itemToLabels;
    }

    getItems(attribute = null) {
        return this._items[attribute || this._rootAttribute];
    }

    getEntries(attribute = null) {
        attribute = attribute || this._rootAttribute;

        return this._items[attribute].map(item => [item, this._itemToLabel[attribute][item]]);
    }

    renameItem(oldItem, newItem, newLabel = null) {
        Object.keys(this._items).forEach(attr => {
            const idx = this._items[attr].indexOf(oldItem);
            if (idx !== -1) {
                this._items[attr][idx] = newItem;
            }
        });
        Object.keys(this._itemsToIdx).forEach(attr => {
            if (this._itemsToIdx[attr][oldItem] !== undefined) {
                this._itemsToIdx[attr][newItem] = this._itemsToIdx[attr][oldItem];
                delete this._itemsToIdx[attr][oldItem];
            }
        });
        Object.keys(this._itemToLabel).forEach(attr => {
            if (this._itemToLabel[attr][oldItem]) {
                this._itemToLabel[attr][newItem] = newLabel || newItem;
                delete this._itemToLabel[attr][oldItem];
            }
        });
    }

    drillUp(targetAttr) {
        if (targetAttr === this._rootAttribute) return this;

        const newDimension = new GenericDimension(
            this.id,
            targetAttr,
            this.getItems(targetAttr),
            this.label,
            this._itemToLabel[targetAttr]
        );

        const rootItems = this._items[this._rootAttribute];
        const newItems = this._items[targetAttr];
        const newMapping = this._rootIdxToGroupIdx[targetAttr];

        ol: for (let childAttribute of this.attributes) {
            if (childAttribute === targetAttr) continue; // Skip root attribute.

            const childItems = this._items[childAttribute];
            const childMapping = this._rootIdxToGroupIdx[childAttribute];
            const mapping = {};

            for (let i = 0; i < rootItems.length; ++i) {
                let childItem = childItems[childMapping[i]],
                    newItem = newItems[newMapping[i]];

                // Not possible to build this attribute (no clean cut on the graph)
                if (mapping[newItem] && mapping[newItem] !== childItem) continue ol;

                mapping[newItem] = childItem;
            }

            newDimension.addAttribute(
                targetAttr,
                childAttribute,
                mapping,
                this._itemToLabel[childAttribute]
            );
        }

        return newDimension;
    }

    dice(attribute, items, reorder = false) {
        let oldItems = this._items[this._rootAttribute],
            newItems = null;

        if (this._rootAttribute === attribute) {
            if (reorder) newItems = items.filter(i => oldItems.includes(i));
            else newItems = oldItems.filter(i => items.includes(i));
        } else {
            if (reorder)
                // because it does not make sense.
                throw new Error('Reordering is not allowed when using groups');
            else
                newItems = oldItems.filter(i => {
                    const groupItem = this.getGroupItemFromRootItem(attribute, i);
                    return items.includes(groupItem);
                });
        }

        // return this if the dice does not change the dimension
        if (oldItems.length === newItems.length) {
            let i = 0;
            for (; i < newItems.length; ++i) if (oldItems[i] !== newItems[i]) break;

            if (i === newItems.length) return this;
        }

        let dimension = new GenericDimension(
            this.id,
            this._rootAttribute,
            newItems,
            this.label,
            this._itemToLabel[this._rootAttribute]
        );
        for (let attribute of this.attributes)
            if (attribute !== this._rootAttribute)
                dimension.addAttribute(
                    this._rootAttribute,
                    attribute,
                    item => this.getGroupItemFromRootItem(attribute, item),
                    this._itemToLabel[attribute]
                );

        return dimension;
    }

    getGroupIndexFromRootIndexMap(groupAttr) {
        this._checkAttribute(groupAttr);

        return this._rootIdxToGroupIdx[groupAttr];
    }

    getGroupIndexFromRootIndex(groupAttr, rootIdx) {
        this._checkAttribute(groupAttr);
        this._checkRootIndex(rootIdx);

        return this._rootIdxToGroupIdx[groupAttr][rootIdx];
    }

    union(otherDimension) {
        if (this.id !== otherDimension.id) throw new Error('not the same dimension');

        // Choose rootAttribute
        let me = this,
            other = otherDimension;
        if (this.attributes.includes(otherDimension._rootAttribute))
            me = me.drillUp(otherDimension._rootAttribute);
        else if (otherDimension.attributes.includes(this._rootAttribute))
            other = other.drillUp(this._rootAttribute);
        else throw new Error(`The dimensions are not compatible`);

        // Mapping functions
        const anyItemToGroup = (groupAttr, rootItem) => {
            try {
                return me.getGroupItemFromRootItem(groupAttr, rootItem);
            } catch (e) {
                return other.getGroupItemFromRootItem(groupAttr, rootItem);
            }
        };

        const anyItemToLabel = (attr, item) => {
            if (me._itemToLabel[attr] && me._itemToLabel[attr][item])
                return me._itemToLabel[attr][item];
            else if (other._itemToLabel[attr] && other._itemToLabel[attr][item])
                return other._itemToLabel[attr][item];
            else return item;
        };

        // Create union and merge groups.
        const dimension = new GenericDimension(
            me.id,
            me._rootAttribute,
            [
                ...me.getItems(),
                ...otherDimension.getItems().filter(item => !me.getItems().includes(item)),
            ],
            me.label,
            item => anyItemToLabel(me._rootAttribute, item)
        );

        // List all groups
        // fixme: would look better using sets
        let groupAttrs = {};
        for (let attribute of me.attributes)
            if (attribute !== me._rootAttribute) groupAttrs[attribute] = true;
        for (let attribute of other.attributes)
            if (attribute !== other._rootAttribute) groupAttrs[attribute] = true;

        for (let groupAttr in groupAttrs)
            try {
                dimension.addAttribute(
                    me._rootAttribute,
                    groupAttr,
                    rootItem => anyItemToGroup(groupAttr, rootItem),
                    groupItem => anyItemToLabel(groupAttr, groupItem)
                );
            } catch (e) {}

        return dimension;
    }

    intersect(otherDimension) {
        if (this.id !== otherDimension.id) throw new Error('not the same dimension');

        let rootAttribute;
        if (this.attributes.includes(otherDimension._rootAttribute))
            rootAttribute = otherDimension._rootAttribute;
        else if (otherDimension.attributes.includes(this._rootAttribute))
            rootAttribute = this._rootAttribute;
        else throw new Error(`The dimensions are not compatible`);

        const otherItems = otherDimension.getItems(rootAttribute);
        const commonItems = this.getItems(rootAttribute).filter(i => otherItems.includes(i));

        return this.drillUp(rootAttribute).dice(rootAttribute, commonItems);
    }

    _getOrCall(objfun, param) {
        if (!objfun) return param;
        else if (typeof objfun == 'function') return objfun(param);
        else return objfun[param];
    }
}

module.exports = GenericDimension;

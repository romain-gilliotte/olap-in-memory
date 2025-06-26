abstract class AbstractDimension {
    id: string;
    protected _rootAttribute: string;
    protected _label: string | null;
    protected _itemsToIdx: Record<string, Record<string, number>>;

    get numItems(): number {
        return this.getItems().length;
    }

    get rootAttribute(): string {
        return this._rootAttribute;
    }

    abstract get attributes(): string[];

    get label(): string | null {
        return this._label;
    }

    /**
     * Create a simple dimension
     *
     * @param  {string} id         ie: "location"
     * @param  {string} rootAttribute  ie: "zipCode"
     * @param  {string | null} label
     */
    constructor(id: string, rootAttribute: string, label: string | null = null) {
        this.id = id;
        this._rootAttribute = rootAttribute;
        this._label = label;
        this._itemsToIdx = {};
    }

    abstract getItems(attribute?: string | null): string[];

    abstract drillUp(newAttribute: string): AbstractDimension;

    abstract dice(attribute: string, items: string[], reorder?: boolean): AbstractDimension;

    abstract diceRange(attribute: string, start: any, end: any): AbstractDimension;

    abstract drillDown(attribute: string): AbstractDimension;

    abstract union(otherDimension: AbstractDimension): AbstractDimension;

    abstract intersect(otherDimension: AbstractDimension): AbstractDimension;

    abstract serialize(): ArrayBuffer;

    abstract getGroupIndexFromRootIndex(groupAttr: string, rootIndex: number): number;

    abstract getGroupIndexFromRootIndexMap(attribute: string): number[];

    getRootIndexFromRootItem(rootItem: string): number {
        const rootItemsToIdx = this.getItemsToIdx();
        const result = rootItemsToIdx[rootItem];
        return result === undefined ? -1 : result;
    }

    getItemsToIdx(attribute: string | null = null): Record<string, number> {
        const attr = attribute || this._rootAttribute;

        if (!this._itemsToIdx[attr]) {
            const itemsToIdx: Record<string, number> = {};
            const items = this.getItems(attr);
            const numItems = items.length;

            for (let i = 0; i < numItems; ++i) itemsToIdx[items[i]] = i;

            this._itemsToIdx[attr] = itemsToIdx;
        }

        return this._itemsToIdx[attr];
    }

    getGroupIndexFromRootItem(groupAttr: string, rootItem: string): number {
        const rootIndex = this.getRootIndexFromRootItem(rootItem);
        return this.getGroupIndexFromRootIndex(groupAttr, rootIndex);
    }

    getGroupItemFromRootIndex(groupAttr: string, rootIndex: number): string {
        const groupIndex = this.getGroupIndexFromRootIndex(groupAttr, rootIndex);
        const groupItems = this.getItems(groupAttr);
        return groupItems[groupIndex];
    }

    getGroupItemFromRootItem(groupAttr: string, rootItem: string): string {
        const groupIndex = this.getGroupIndexFromRootItem(groupAttr, rootItem);
        const groupItems = this.getItems(groupAttr);
        return groupItems[groupIndex];
    }

    protected _checkRootIndex(index: number): void {
        if (index < 0 || index >= this.numItems)
            throw new Error(`rootIndex ${index} out of bounds [0, ${this.numItems}[`);
    }

    protected _checkAttribute(attribute: string): void {
        if (!this.attributes.includes(attribute))
            throw new Error(`No attribute ${attribute} was found on dimension ${this.id}`);
    }
}

export = AbstractDimension;

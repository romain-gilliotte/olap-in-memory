import AbstractDimension from './abstract';

class CatchAll extends AbstractDimension {
    childDimension: AbstractDimension | null;

    get attributes(): string[] {
        throw new Error('Unsupported');
    }

    /**
     * Create a simple dimension
     */
    constructor(id: string, childDimension: AbstractDimension | null = null) {
        super(id, 'all');
        this.childDimension = childDimension;
    }

    serialize(): never {
        throw new Error('Unsupported');
    }

    getItems(attribute: string | null = null): string[] {
        return ['_total'];
    }

    getEntries(attribute: string | null = null, language: string = 'en'): [string, string][] {
        return [['_total', 'Total']];
    }

    drillUp(newAttribute: string): CatchAll {
        return this;
    }

    drillDown(newAttribute: string): AbstractDimension {
        if (this.childDimension) return this.childDimension.drillUp(newAttribute);
        else throw new Error('Must set child dimension.');
    }

    dice(attribute: string, items: string[], reorder: boolean = false): CatchAll {
        if (attribute === this.rootAttribute && items.includes('_total')) return this;
        else throw new Error('Unsupported');
    }

    diceRange(attribute: string, start: unknown, end: unknown): never {
        throw new Error('Unsupported');
    }

    /**
     *
     * @param  {string} attribute eg: month
     * @param  {number} index     32
     * @return {number}           2
     */
    protected getGroupIndexFromRootIndex(attribute: string, index: number): number {
        return 0;
    }

    getGroupIndexFromRootIndexMap(attribute: string): number[] {
        // For catch-all, everything maps to index 0
        return new Array(this.numItems).fill(0);
    }

    intersect(otherDimension: AbstractDimension): AbstractDimension {
        return otherDimension;
    }

    union(otherDimension: AbstractDimension): CatchAll {
        return this;
    }
}

export default CatchAll;

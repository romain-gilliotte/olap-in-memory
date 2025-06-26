const { describe, it, beforeEach, expect } = require('@jest/globals');

// Create a concrete implementation of AbstractDimension for testing
const AbstractDimension = require('../src/dimension/abstract');

class TestDimension extends AbstractDimension {
    constructor(id, rootAttribute, label = null) {
        super(id, rootAttribute, label);
        this._items = ['item1', 'item2', 'item3'];
    }

    get attributes() {
        return ['attr1', 'attr2'];
    }

    getItems(attribute = null) {
        return this._items;
    }

    drillUp(newAttribute) {
        return new TestDimension(this.id, newAttribute, this.label);
    }

    dice(attribute, items, reorder = false) {
        return new TestDimension(this.id, attribute, this.label);
    }

    diceRange(attribute, start, end) {
        return new TestDimension(this.id, attribute, this.label);
    }

    getGroupIndexFromRootIndex(groupAttr, rootIndex) {
        return rootIndex % 2;
    }
}

describe('AbstractDimension', function () {
    describe('constructor', function () {
        it('should create dimension with required parameters', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.id).toBe('test');
            expect(dimension.rootAttribute).toBe('rootAttr');
            expect(dimension.label).toBeNull();
        });

        it('should create dimension with label', function () {
            const dimension = new TestDimension('test', 'rootAttr', 'Test Label');
            expect(dimension.id).toBe('test');
            expect(dimension.rootAttribute).toBe('rootAttr');
            expect(dimension.label).toBe('Test Label');
        });
    });

    describe('numItems', function () {
        it('should return correct number of items', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.numItems).toBe(3);
        });
    });

    describe('rootAttribute', function () {
        it('should return correct root attribute', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.rootAttribute).toBe('rootAttr');
        });
    });

    describe('attributes', function () {
        it('should return attributes from concrete implementation', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.attributes).toEqual(['attr1', 'attr2']);
        });
    });

    describe('label', function () {
        it('should return correct label', function () {
            const dimension = new TestDimension('test', 'rootAttr', 'Test Label');
            expect(dimension.label).toBe('Test Label');
        });
    });

    describe('getItems', function () {
        it('should return items from concrete implementation', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.getItems()).toEqual(['item1', 'item2', 'item3']);
        });
    });

    describe('getItemsToIdx', function () {
        it('should create items to index mapping', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping = dimension.getItemsToIdx();
            expect(mapping).toEqual({
                item1: 0,
                item2: 1,
                item3: 2,
            });
        });

        it('should cache the mapping', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping1 = dimension.getItemsToIdx();
            const mapping2 = dimension.getItemsToIdx();
            expect(mapping1).toBe(mapping2);
        });

        it('should work with custom attribute', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping = dimension.getItemsToIdx('customAttr');
            expect(mapping).toEqual({
                item1: 0,
                item2: 1,
                item3: 2,
            });
        });
    });

    describe('getRootIndexFromRootItem', function () {
        it('should return correct index for existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.getRootIndexFromRootItem('item1')).toBe(0);
            expect(dimension.getRootIndexFromRootItem('item2')).toBe(1);
            expect(dimension.getRootIndexFromRootItem('item3')).toBe(2);
        });

        it('should return -1 for non-existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.getRootIndexFromRootItem('nonexistent')).toBe(-1);
        });
    });

    describe('getGroupIndexFromRootItem', function () {
        it('should return correct group index for existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.getGroupIndexFromRootItem(0)).toBe($3);
            expect(dimension.getGroupIndexFromRootItem(1)).toBe($3);
            expect(dimension.getGroupIndexFromRootItem(0)).toBe($3);
        });

        it('should return -1 for non-existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            expect(dimension.getGroupIndexFromRootItem(-1)).toBe($3);
        });
    });
});

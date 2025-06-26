const assert = require('chai').assert;

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
            assert.equal(dimension.id, 'test');
            assert.equal(dimension.rootAttribute, 'rootAttr');
            assert.isNull(dimension.label);
        });

        it('should create dimension with label', function () {
            const dimension = new TestDimension('test', 'rootAttr', 'Test Label');
            assert.equal(dimension.id, 'test');
            assert.equal(dimension.rootAttribute, 'rootAttr');
            assert.equal(dimension.label, 'Test Label');
        });
    });

    describe('numItems', function () {
        it('should return correct number of items', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.numItems, 3);
        });
    });

    describe('rootAttribute', function () {
        it('should return correct root attribute', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.rootAttribute, 'rootAttr');
        });
    });

    describe('attributes', function () {
        it('should return attributes from concrete implementation', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.deepEqual(dimension.attributes, ['attr1', 'attr2']);
        });
    });

    describe('label', function () {
        it('should return correct label', function () {
            const dimension = new TestDimension('test', 'rootAttr', 'Test Label');
            assert.equal(dimension.label, 'Test Label');
        });
    });

    describe('getItems', function () {
        it('should return items from concrete implementation', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.deepEqual(dimension.getItems(), ['item1', 'item2', 'item3']);
        });
    });

    describe('getItemsToIdx', function () {
        it('should create items to index mapping', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping = dimension.getItemsToIdx();
            assert.deepEqual(mapping, {
                item1: 0,
                item2: 1,
                item3: 2,
            });
        });

        it('should cache the mapping', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping1 = dimension.getItemsToIdx();
            const mapping2 = dimension.getItemsToIdx();
            assert.equal(mapping1, mapping2);
        });

        it('should work with custom attribute', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            const mapping = dimension.getItemsToIdx('customAttr');
            assert.deepEqual(mapping, {
                item1: 0,
                item2: 1,
                item3: 2,
            });
        });
    });

    describe('getRootIndexFromRootItem', function () {
        it('should return correct index for existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.getRootIndexFromRootItem('item1'), 0);
            assert.equal(dimension.getRootIndexFromRootItem('item2'), 1);
            assert.equal(dimension.getRootIndexFromRootItem('item3'), 2);
        });

        it('should return -1 for non-existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.getRootIndexFromRootItem('nonexistent'), -1);
        });
    });

    describe('getGroupIndexFromRootItem', function () {
        it('should return correct group index for existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.getGroupIndexFromRootItem('groupAttr', 'item1'), 0);
            assert.equal(dimension.getGroupIndexFromRootItem('groupAttr', 'item2'), 1);
            assert.equal(dimension.getGroupIndexFromRootItem('groupAttr', 'item3'), 0);
        });

        it('should return -1 for non-existing item', function () {
            const dimension = new TestDimension('test', 'rootAttr');
            assert.equal(dimension.getGroupIndexFromRootItem('groupAttr', 'nonexistent'), -1);
        });
    });

    describe('abstract methods', function () {
        it('should throw error for drillUp in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.drillUp('newAttr');
                },
                Error,
                'Override me'
            );
        });

        it('should throw error for dice in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.dice('attr', ['item1']);
                },
                Error,
                'Override me'
            );
        });

        it('should throw error for diceRange in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.diceRange('attr', 'start', 'end');
                },
                Error,
                'Override me'
            );
        });

        it('should throw error for getGroupIndexFromRootIndex in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.getGroupIndexFromRootIndex('groupAttr', 0);
                },
                Error,
                'Override me'
            );
        });

        it('should throw error for attributes in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.attributes;
                },
                Error,
                'Override me'
            );
        });

        it('should throw error for getItems in abstract class', function () {
            const dimension = new AbstractDimension('test', 'rootAttr');
            assert.throws(
                () => {
                    dimension.getItems();
                },
                Error,
                'Override me'
            );
        });
    });
});

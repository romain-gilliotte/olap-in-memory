const assert = require('chai').assert;
const CatchAllDimension = require('../src/dimension/catch-all');
const GenericDimension = require('../src/dimension/generic');

describe('CatchAllDimension', function () {
    describe('constructor', function () {
        it('should create a catch-all dimension with default child dimension', function () {
            const catchAll = new CatchAllDimension('test');
            assert.equal(catchAll.id, 'test');
            assert.equal(catchAll.rootAttribute, 'all');
            assert.isNull(catchAll.childDimension);
            assert.isNull(catchAll.label);
        });

        it('should create a catch-all dimension with custom child dimension', function () {
            const childDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const catchAll = new CatchAllDimension('test', childDimension);
            assert.equal(catchAll.id, 'test');
            assert.equal(catchAll.rootAttribute, 'all');
            assert.equal(catchAll.childDimension, childDimension);
        });
    });

    describe('attributes', function () {
        it('should throw error when accessing attributes', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.attributes;
                },
                Error,
                'Unsupported'
            );
        });
    });

    describe('serialize', function () {
        it('should throw error when serializing', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.serialize();
                },
                Error,
                'Unsupported'
            );
        });
    });

    describe('getItems', function () {
        it('should return total item for any attribute', function () {
            const catchAll = new CatchAllDimension('test');
            assert.deepEqual(catchAll.getItems(), ['_total']);
            assert.deepEqual(catchAll.getItems('any-attribute'), ['_total']);
        });
    });

    describe('getEntries', function () {
        it('should return total entry for any attribute', function () {
            const catchAll = new CatchAllDimension('test');
            assert.deepEqual(catchAll.getEntries(), [['_total', 'Total']]);
            assert.deepEqual(catchAll.getEntries('any-attribute'), [['_total', 'Total']]);
            assert.deepEqual(catchAll.getEntries('any-attribute', 'fr'), [['_total', 'Total']]);
        });
    });

    describe('drillUp', function () {
        it('should return itself for any attribute', function () {
            const catchAll = new CatchAllDimension('test');
            const result = catchAll.drillUp('any-attribute');
            assert.equal(result, catchAll);
        });
    });

    describe('drillDown', function () {
        it('should throw error when no child dimension is set', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.drillDown('any-attribute');
                },
                Error,
                'Must set child dimension.'
            );
        });

        it('should delegate to child dimension when set', function () {
            const childDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const catchAll = new CatchAllDimension('test', childDimension);
            const result = catchAll.drillDown('city');
            // Should return the child dimension drilled up to 'city' attribute
            assert.notEqual(result, catchAll);
            assert.instanceOf(result, GenericDimension);
            assert.equal(result.rootAttribute, 'city');
        });
    });

    describe('dice', function () {
        it('should return itself when dicing on root attribute with total', function () {
            const catchAll = new CatchAllDimension('test');
            const result = catchAll.dice('all', ['_total']);
            assert.equal(result, catchAll);
        });

        it('should throw error when dicing on non-root attribute', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.dice('other-attribute', ['_total']);
                },
                Error,
                'Unsupported'
            );
        });

        it('should throw error when dicing without total', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.dice('all', ['other-item']);
                },
                Error,
                'Unsupported'
            );
        });
    });

    describe('diceRange', function () {
        it('should throw error for dice range', function () {
            const catchAll = new CatchAllDimension('test');
            assert.throws(
                () => {
                    catchAll.diceRange('any-attribute', 'start', 'end');
                },
                Error,
                'Unsupported'
            );
        });
    });

    describe('getGroupIndexFromRootIndex', function () {
        it('should always return 0 for any attribute and index', function () {
            const catchAll = new CatchAllDimension('test');
            assert.equal(catchAll.getGroupIndexFromRootIndex('any-attribute', 0), 0);
            assert.equal(catchAll.getGroupIndexFromRootIndex('any-attribute', 42), 0);
            assert.equal(catchAll.getGroupIndexFromRootIndex('other-attribute', 100), 0);
        });
    });

    describe('intersect', function () {
        it('should return the other dimension', function () {
            const catchAll = new CatchAllDimension('test');
            const otherDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const result = catchAll.intersect(otherDimension);
            assert.equal(result, otherDimension);
        });
    });

    describe('union', function () {
        it('should return itself', function () {
            const catchAll = new CatchAllDimension('test');
            const otherDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const result = catchAll.union(otherDimension);
            assert.equal(result, catchAll);
        });
    });

    describe('inherited properties', function () {
        it('should have correct numItems', function () {
            const catchAll = new CatchAllDimension('test');
            assert.equal(catchAll.numItems, 1);
        });

        it('should have correct rootAttribute', function () {
            const catchAll = new CatchAllDimension('test');
            assert.equal(catchAll.rootAttribute, 'all');
        });

        it('should have correct label', function () {
            const catchAll = new CatchAllDimension('test');
            assert.isNull(catchAll.label);
        });
    });
});

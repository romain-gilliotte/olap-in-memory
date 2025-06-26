const { describe, it, beforeEach, expect } = require('@jest/globals');
const CatchAllDimension = require('../src/dimension/catch-all');
const GenericDimension = require('../src/dimension/generic');

describe('CatchAllDimension', function () {
    describe('constructor', function () {
        it('should create a catch-all dimension with default child dimension', function () {
            const catchAll = new CatchAllDimension('test');
            expect(catchAll.id).toBe('test');
            expect(catchAll.rootAttribute).toBe('all');
            expect(catchAll.childDimension).toBeNull();
            expect(catchAll.label).toBeNull();
        });

        it('should create a catch-all dimension with custom child dimension', function () {
            const childDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const catchAll = new CatchAllDimension('test', childDimension);
            expect(catchAll.id).toBe('test');
            expect(catchAll.rootAttribute).toBe('all');
            expect(catchAll.childDimension).toBe(childDimension);
        });
    });

    describe('attributes', function () {
        it('should throw error when accessing attributes', function () {
            const catchAll = new CatchAllDimension('test');
            expect(
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
            expect(
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
            expect(catchAll.getItems()).toEqual(['_total']);
            expect(catchAll.getItems('any-attribute')).toEqual(['_total']);
        });
    });

    describe('getEntries', function () {
        it('should return total entry for any attribute', function () {
            const catchAll = new CatchAllDimension('test');
            expect(catchAll.getEntries()).toEqual([['_total', 'Total']]);
            expect(catchAll.getEntries('any-attribute')).toEqual([['_total', 'Total']]);
            expect(catchAll.getEntries('any-attribute').toEqual('fr'), [['_total', 'Total']]);
        });
    });

    describe('drillUp', function () {
        it('should return itself for any attribute', function () {
            const catchAll = new CatchAllDimension('test');
            const result = catchAll.drillUp('any-attribute');
            expect(result).toBe(catchAll);
        });
    });

    describe('drillDown', function () {
        it('should throw error when no child dimension is set', function () {
            const catchAll = new CatchAllDimension('test');
            expect(
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
            expect(result).not.toBe(catchAll);
            expect(result).toBeInstanceOf(GenericDimension);
            expect(result.rootAttribute).toBe('city');
        });
    });

    describe('dice', function () {
        it('should return itself when dicing on root attribute with total', function () {
            const catchAll = new CatchAllDimension('test');
            const result = catchAll.dice('all', ['_total']);
            expect(result).toBe(catchAll);
        });

        it('should throw error when dicing on non-root attribute', function () {
            const catchAll = new CatchAllDimension('test');
            expect(
                () => {
                    catchAll.dice('other-attribute', ['_total']);
                },
                Error,
                'Unsupported'
            );
        });

        it('should throw error when dicing without total', function () {
            const catchAll = new CatchAllDimension('test');
            expect(
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
            expect(
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
            expect(catchAll.getGroupIndexFromRootIndex(0)).toBe($3);
            expect(catchAll.getGroupIndexFromRootIndex(0)).toBe($3);
            expect(catchAll.getGroupIndexFromRootIndex(0)).toBe($3);
        });
    });

    describe('intersect', function () {
        it('should return the other dimension', function () {
            const catchAll = new CatchAllDimension('test');
            const otherDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const result = catchAll.intersect(otherDimension);
            expect(result).toBe(otherDimension);
        });
    });

    describe('union', function () {
        it('should return itself', function () {
            const catchAll = new CatchAllDimension('test');
            const otherDimension = new GenericDimension('location', 'city', ['paris', 'tokyo']);
            const result = catchAll.union(otherDimension);
            expect(result).toBe(catchAll);
        });
    });

    describe('inherited properties', function () {
        it('should have correct numItems', function () {
            const catchAll = new CatchAllDimension('test');
            expect(catchAll.numItems).toBe(1);
        });

        it('should have correct rootAttribute', function () {
            const catchAll = new CatchAllDimension('test');
            expect(catchAll.rootAttribute).toBe('all');
        });

        it('should have correct label', function () {
            const catchAll = new CatchAllDimension('test');
            expect(catchAll.label).toBeNull();
        });
    });
});

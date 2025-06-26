const assert = require('chai').assert;
const { Cube, GenericDimension, TimeDimension } = require('../dist');

describe('Cube Edge Cases', function () {
    describe('error handling', function () {
        it('should throw error when setData is called on computed measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.createComputedMeasure('computed', 'antennas * 2');

            assert.throws(
                () => {
                    cube.setData('computed', [1, 2]);
                },
                Error,
                'setData can only be called on stored measures'
            );
        });

        it('should throw error when getData is called on non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            assert.throws(
                () => {
                    cube.getData('nonexistent');
                },
                Error,
                'No such measure'
            );
        });

        it('should throw error when getStatus is called on non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            assert.throws(
                () => {
                    cube.getStatus('nonexistent');
                },
                Error,
                'No such measure'
            );
        });

        it('should throw error when slice is called on non-existent dimension', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            assert.throws(
                () => {
                    cube.slice('nonexistent', 'city', 'paris');
                },
                Error,
                'No such dimension.'
            );
        });
    });

    describe('dropMeasure', function () {
        it('should drop computed measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.createComputedMeasure('computed', 'antennas * 2');

            cube.dropMeasure('computed');
            assert.isUndefined(cube.computedMeasures['computed']);
            assert.isDefined(cube.storedMeasures['antennas']);
        });

        it('should drop stored measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            cube.dropMeasure('antennas');
            assert.isUndefined(cube.storedMeasures['antennas']);
            assert.isUndefined(cube.storedMeasuresRules['antennas']);
        });

        it('should throw error when dropping non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            assert.throws(
                () => {
                    cube.dropMeasure('nonexistent');
                },
                Error,
                'No such measure'
            );
        });
    });

    describe('reorderDimensions', function () {
        it('should return same cube when dimensions are already in correct order', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');

            const result = cube.reorderDimensions(['location', 'time']);
            assert.equal(result, cube);
        });

        it('should reorder dimensions correctly', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2, 3, 4]);

            const result = cube.reorderDimensions(['time', 'location']);
            assert.deepEqual(result.dimensionIds, ['time', 'location']);
            assert.notEqual(result, cube);
        });
    });

    describe('diceRange', function () {
        it('should handle cubes with no overlap gracefully', function () {
            const cube1 = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube1.createStoredMeasure('antennas');

            const cube2 = new Cube([
                new GenericDimension('location', 'city', ['london', 'berlin']),
            ]);
            cube2.createStoredMeasure('antennas');

            // Should not throw error
            cube1.hydrateFromCube(cube2);
        });
    });

    describe('dice', function () {
        it('should return same cube when dice does not change dimension', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            const result = cube.dice('location', 'city', ['paris', 'tokyo']);
            assert.equal(result, cube);
        });

        it('should create new cube when dice changes dimension', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo', 'london']),
            ]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2, 3]);

            const result = cube.dice('location', 'city', ['paris', 'tokyo']);
            assert.notEqual(result, cube);
            assert.deepEqual(result.getDimension('location').getItems(), ['paris', 'tokyo']);
        });
    });

    describe('keepDimensions', function () {
        it('should keep only specified dimensions', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');

            const result = cube.keepDimensions(['location']);
            assert.deepEqual(result.dimensionIds, ['location']);
        });
    });

    describe('removeDimensions', function () {
        it('should remove specified dimensions', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');

            const result = cube.removeDimensions(['time']);
            assert.deepEqual(result.dimensionIds, ['location']);
        });
    });

    describe('addDimension', function () {
        it('should add dimension at specified index', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            const newDimension = new GenericDimension('time', 'month', ['jan', 'feb']);
            const result = cube.addDimension(newDimension, {}, 0);

            assert.deepEqual(result.dimensionIds, ['time', 'location']);
        });

        it('should add dimension at end when index is null', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            const newDimension = new GenericDimension('time', 'month', ['jan', 'feb']);
            const result = cube.addDimension(newDimension);

            assert.deepEqual(result.dimensionIds, ['location', 'time']);
        });
    });

    describe('project', function () {
        it('should project to specified dimensions', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');

            const result = cube.project(['location']);
            assert.deepEqual(result.dimensionIds, ['location']);
        });
    });

    describe('getNestedObject with metadata', function () {
        it('should return nested object with metadata', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2]);

            const result = cube.getNestedObject('antennas', false, true);
            assert.isObject(result);
            // The exact structure depends on the formatter implementation
        });
    });

    describe('hydrateFromCube', function () {
        it('should handle cubes with no overlap gracefully', function () {
            const cube1 = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube1.createStoredMeasure('antennas');

            const cube2 = new Cube([
                new GenericDimension('location', 'city', ['london', 'berlin']),
            ]);
            cube2.createStoredMeasure('antennas');

            // Should not throw error
            cube1.hydrateFromCube(cube2);
        });
    });
});

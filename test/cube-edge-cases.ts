import Cube from '../src/cube';
import GenericDimension from '../src/dimension/generic';
import { TimeDimension } from '../src';

describe('Cube Edge Cases', function () {
    describe('error handling', function () {
        it('should throw error when setData is called on computed measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.createComputedMeasure('computed', 'antennas * 2');

            expect(() => {
                cube.setData('computed', [1, 2]);
            }).toThrow('setData can only be called on stored measures');
        });

        it('should throw error when getData is called on non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            expect(() => {
                cube.getData('nonexistent');
            }).toThrow('No such measure');
        });

        it('should throw error when getStatus is called on non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            expect(() => {
                cube.getStatus('nonexistent');
            }).toThrow('No such measure');
        });

        it('should throw error when slice is called on non-existent dimension', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            expect(() => {
                cube.slice('nonexistent', 'city', 'paris');
            }).toThrow('No such dimension.');
        });
    });

    describe('dropMeasure', function () {
        it('should drop computed measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.createComputedMeasure('computed', 'antennas * 2');

            cube.dropMeasure('computed');
            expect(cube.computedMeasures['computed']).toBeUndefined();
            expect(cube.storedMeasures['antennas']).toBeDefined();
        });

        it('should drop stored measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            cube.dropMeasure('antennas');
            expect(cube.storedMeasures['antennas']).toBeUndefined();
            expect(cube.storedMeasuresRules['antennas']).toBeUndefined();
        });

        it('should throw error when dropping non-existent measure', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);

            expect(() => {
                cube.dropMeasure('nonexistent');
            }).toThrow('No such measure');
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
            expect(result).toBe(cube);
        });

        it('should reorder dimensions correctly', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo']),
                new GenericDimension('time', 'month', ['jan', 'feb']),
            ]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2, 3, 4]);

            const result = cube.reorderDimensions(['time', 'location']);
            expect(result.dimensionIds).toEqual(['time', 'location']);
            expect(result).not.toBe(cube);
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
            expect(result).toBe(cube);
        });

        it('should create new cube when dice changes dimension', function () {
            const cube = new Cube([
                new GenericDimension('location', 'city', ['paris', 'tokyo', 'london']),
            ]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2, 3]);

            const result = cube.dice('location', 'city', ['paris', 'tokyo']);
            expect(result).not.toBe(cube);
            const locationDim = result.getDimension('location');
            expect(locationDim).toBeDefined();
            expect(locationDim!.getItems()).toEqual(['paris', 'tokyo']);
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
            expect(result.dimensionIds).toEqual(['location']);
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
            expect(result.dimensionIds).toEqual(['location']);
        });
    });

    describe('addDimension', function () {
        it('should add dimension at specified index', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            const newDimension = new GenericDimension('time', 'month', ['jan', 'feb']);
            const result = cube.addDimension(newDimension, {}, 0);

            expect(result.dimensionIds).toEqual(['time', 'location']);
        });

        it('should add dimension at end when index is null', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');

            const newDimension = new GenericDimension('time', 'month', ['jan', 'feb']);
            const result = cube.addDimension(newDimension);

            expect(result.dimensionIds).toEqual(['location', 'time']);
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
            expect(result.dimensionIds).toEqual(['location']);
        });
    });

    describe('getNestedObject with metadata', function () {
        it('should return nested object with metadata', function () {
            const cube = new Cube([new GenericDimension('location', 'city', ['paris', 'tokyo'])]);
            cube.createStoredMeasure('antennas');
            cube.setData('antennas', [1, 2]);

            const result = cube.getNestedObject('antennas', false, true);
            expect(typeof result).toBe('object');
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

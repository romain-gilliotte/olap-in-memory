import createTestCube from './helpers/create-test-cube';
import Cube from '../src/cube';
import { GenericDimension, TimeDimension } from '../src';

describe('Accessors', function () {
    describe('getting data', function () {
        let cube: any;

        beforeEach(function () {
            cube = createTestCube(true, true);
        });

        it('should have a storeSize of 6', function () {
            expect(cube.storeSize).toBe(6);
        });

        it('should have a byteLength of 48', function () {
            expect(cube.byteLength).toBe(48);
        });

        it('should retrieve flat array', function () {
            expect(cube.getData('antennas')).toEqual([1, 2, 4, 8, 16, 32]);
        });

        it('should retrieve nested array', function () {
            expect(cube.getNestedArray('antennas')).toEqual([
                [1, 2],
                [4, 8],
                [16, 32],
            ]);
        });

        it('should retrieve nested object', function () {
            expect(cube.getNestedObject('antennas')).toEqual({
                paris: { summer: 1, winter: 2 },
                toledo: { summer: 4, winter: 8 },
                tokyo: { summer: 16, winter: 32 },
            });
        });

        it('should retrieve nested object w/ totals', function () {
            expect(cube.getNestedObject('antennas', true)).toEqual({
                paris: { summer: 1, winter: 2, all: 3 },
                toledo: { summer: 4, winter: 8, all: 12 },
                tokyo: { summer: 16, winter: 32, all: 48 },
                all: { summer: 21, winter: 42, all: 63 },
            });
        });

        it('should retrieve nested object w/ totals on a cube with no dimensions', function () {
            let myCube = new Cube([]);
            myCube.createStoredMeasure('antennas');
            myCube.setData('antennas', [32]);

            expect(myCube.getNestedObject('antennas', true)).toEqual(32);
        });

        it('should compute flat array', function () {
            expect(cube.getData('router_by_antennas')).toEqual([
                3 / 1,
                2 / 2,
                4 / 4,
                9 / 8,
                16 / 16,
                32 / 32,
            ]);
        });
    });

    describe('setting data', function () {
        let cube: any;

        beforeEach(function () {
            cube = createTestCube(true, false);
        });

        it('should set flat array', function () {
            cube.setData('antennas', [1, 2, 4, 8, 16, 32]);
            expect(cube.getData('antennas')).toEqual([1, 2, 4, 8, 16, 32]);
        });

        it('should set nested array', function () {
            cube.setNestedArray('antennas', [
                [1, 2],
                [4, 8],
                [16, 32],
            ]);
            expect(cube.getData('antennas')).toEqual([1, 2, 4, 8, 16, 32]);
        });

        it('should set nested object', function () {
            cube.setNestedObject('antennas', {
                paris: { summer: 1, winter: 2 },
                toledo: { summer: 4, winter: 8 },
                tokyo: { summer: 16, winter: 32 },
            });

            expect(cube.getData('antennas')).toEqual([1, 2, 4, 8, 16, 32]);
        });
    });

    describe('hydrateFromSparseNestedObject', function () {
        it('should work on a simple case', function () {
            const cube = new Cube([
                new GenericDimension('period', 'season', ['summer', 'winter']),
                new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']),
            ]);

            cube.createStoredMeasure('antennas', {}, 'float32', 0);
            cube.hydrateFromSparseNestedObject('antennas', { winter: { toledo: 1 } });

            expect(cube.getNestedObject('antennas')).toEqual({
                summer: { paris: 0, toledo: 0, tokyo: 0 },
                winter: { paris: 0, toledo: 1, tokyo: 0 },
            });
        });

        it('should work with data which needs ignoring', function () {
            const cube = new Cube([
                new GenericDimension('period', 'season', ['summer', 'winter']),
                new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']),
            ]);

            cube.createStoredMeasure('antennas', {}, 'float32', 0);
            cube.hydrateFromSparseNestedObject('antennas', {
                winter: { toledo: 1, losangeles: 2 },
            });

            expect(cube.getNestedObject('antennas')).toEqual({
                summer: { paris: 0, toledo: 0, tokyo: 0 },
                winter: { paris: 0, toledo: 1, tokyo: 0 },
            });
        });

        it('Setting a value to null or NaN should unset it', function () {
            const cube = createTestCube(true, true);
            cube.hydrateFromSparseNestedObject('antennas', { toledo: { summer: null } });

            expect(isNaN(cube.getData('antennas')[2])).toBe(true);
            expect(cube.getStatus('antennas')[2]).toBe(1);
        });
    });
});

import createTestCube from './helpers/create-test-cube';
import Cube from '../src/cube';

describe('Filtering', function () {
    let cube: any;

    beforeEach(function () {
        cube = createTestCube(true, true);
    });

    describe('slice', function () {
        it('should remove cities', function () {
            const parisCube = cube.slice('location', 'city', 'paris');

            expect(parisCube.getNestedArray('antennas')).toEqual([1, 2]);
            expect(parisCube.dimensions.length).toBe(1);
            expect(parisCube.dimensions[0].id).toBe('period');
        });

        it('should remove seasons', function () {
            const winterCube = cube.slice('period', 'season', 'winter');

            expect(winterCube.getNestedArray('antennas')).toEqual([2, 8, 32]);
            expect(winterCube.dimensions.length).toBe(1);
            expect(winterCube.dimensions[0].id).toBe('location');
        });

        it('should remove both cities and seasons', function () {
            const tolWinCube = cube
                .slice('period', 'season', 'winter')
                .slice('location', 'city', 'toledo');

            expect(tolWinCube.getNestedArray('antennas')).toEqual(8);
            expect(tolWinCube.dimensions.length).toBe(0);
        });
    });

    describe('dice', function () {
        it('should work on noop', function () {
            let newCube = cube.dice('location', 'city', ['paris', 'toledo', 'tokyo']);

            expect(newCube).toBe(cube);
        });

        it('should dice on cities', function () {
            const parTolCube = cube.dice('location', 'city', ['paris', 'toledo']);

            expect(parTolCube.getNestedArray('antennas')).toEqual([
                [1, 2],
                [4, 8],
            ]);
        });

        it('should dice on cities conserving order', function () {
            const parTolCube = cube.dice('location', 'city', ['toledo', 'paris']);

            expect(parTolCube.getNestedArray('antennas')).toEqual([
                [1, 2],
                [4, 8],
            ]);
        });

        it('should dice on continents', function () {
            const parTolCube = cube.dice('location', 'continent', ['europe']);

            expect(parTolCube.getNestedArray('antennas')).toEqual([
                [1, 2],
                [4, 8],
            ]);
        });

        it('should filter the other dimension', function () {
            const winterCube = cube.dice('period', 'season', ['winter']);

            expect(winterCube.getNestedArray('antennas')).toEqual([[2], [8], [32]]);
        });

        it('should work dicing on non existent item', function () {
            expect(cube.dice('location', 'city', ['nonexisting', 'paris']).storeSize).toBe(
                cube.storeSize / 3
            );
        });

        it('should work dicing on empty array', function () {
            expect(cube.dice('location', 'city', []).storeSize).toBe(0);
        });

        it('should dice on cities reversed', function () {
            const parTolCube = cube.dice('location', 'city', ['toledo', 'paris'], true);

            expect(parTolCube.getNestedArray('antennas')).toEqual([
                [4, 8],
                [1, 2],
            ]);
        });

        it('should not allow reordering on continents', function () {
            expect(() => cube.dice('location', 'continent', ['europe'], true)).toThrow();
        });
    });
});

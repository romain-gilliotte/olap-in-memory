import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import createTestCube from './helpers/create-test-cube';
import Cube from '../src/cube';
import GenericDimension from '../src/dimension/generic';
import TimeDimension from '../src/dimension/time';

describe('Dimension', function () {
    describe('addDimension', function () {
        it('should be able to add generic dimension', function () {
            const cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-02')]);
            cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
            cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

            const newDimension = new GenericDimension('location', 'city', [
                'paris',
                'madrid',
                'berlin',
            ]);
            const newCube = cube.addDimension(newDimension, {
                measure1: 'sum',
                measure2: 'average',
            });

            expect(newCube.removeDimension('location').getNestedObject('measure1')).toEqual(
                cube.getNestedObject('measure1')
            );

            expect(newCube.removeDimension('location').getNestedObject('measure2')).toEqual(
                cube.getNestedObject('measure2')
            );
        });

        it('should be able to add a time dimension', function () {
            const cube = new Cube([new TimeDimension('time1', 'month', '2010-01', '2010-02')]);
            cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
            cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

            const newDimension = new TimeDimension(
                'time2',
                'week_mon',
                '2010-W01-mon',
                '2010-W08-mon'
            );
            const newCube = cube.addDimension(newDimension, {
                measure1: 'sum',
                measure2: 'average',
            });

            expect(newCube.removeDimension('time2').getNestedObject('measure1')).toEqual(
                cube.getNestedObject('measure1')
            );

            expect(newCube.removeDimension('time2').getNestedObject('measure2')).toEqual(
                cube.getNestedObject('measure2')
            );
        });
    });

    describe('removeDimension', function () {
        let cube: Cube;

        beforeEach(function () {
            const period = new GenericDimension('period', 'season', ['summer', 'winter']);
            const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

            cube = new Cube([location, period]);
            const aggregations = ['sum', 'average', 'highest', 'lowest', 'first', 'last'] as const;
            for (let agg of aggregations) {
                cube.createStoredMeasure(
                    `antennas_${agg}`,
                    { period: agg, location: agg },
                    'float32',
                    0
                );
                cube.setNestedArray(`antennas_${agg}`, [
                    [1, 2],
                    [4, 8],
                    [16, 32],
                ]);
            }

            cube = cube.removeDimension('location');
        });

        it('should sum cities', function () {
            expect(cube.getNestedArray('antennas_sum')).toEqual([21, 42]);
        });

        it('should average cities', function () {
            expect(cube.getNestedArray('antennas_average')).toEqual([21 / 3, 42 / 3]);
        });

        it('should highest cities', function () {
            expect(cube.getNestedArray('antennas_highest')).toEqual([16, 32]);
        });

        it('should lowest cities', function () {
            expect(cube.getNestedArray('antennas_lowest')).toEqual([1, 2]);
        });

        it('should first cities', function () {
            expect(cube.getNestedArray('antennas_first')).toEqual([1, 2]);
        });

        it('should last cities', function () {
            expect(cube.getNestedArray('antennas_last')).toEqual([16, 32]);
        });
    });

    describe('reorderDimensions', function () {
        let cube: Cube;

        beforeEach(function () {
            cube = createTestCube(true, true);
        });

        it('should inverse the dimensions', function () {
            expect(
                cube.reorderDimensions(['period', 'location']).getNestedArray('antennas')
            ).toEqual([
                [1, 4, 16],
                [2, 8, 32],
            ]);
        });

        it('should work with more dimensions', function () {
            let cube = new Cube([
                new GenericDimension('dim1', 'item', ['11', '12']),
                new GenericDimension('dim2', 'item', ['21', '22']),
                new GenericDimension('dim3', 'item', ['31', '32']),
            ]);

            cube.createStoredMeasure('main');
            cube.setData('main', [1, 2, 3, 4, 5, 6, 7, 8]);

            expect(
                cube.reorderDimensions(['dim1', 'dim2', 'dim3']).getNestedObject('main')
            ).toEqual({
                11: { 21: { 31: 1, 32: 2 }, 22: { 31: 3, 32: 4 } },
                12: { 21: { 31: 5, 32: 6 }, 22: { 31: 7, 32: 8 } },
            });

            expect(
                cube.reorderDimensions(['dim1', 'dim3', 'dim2']).getNestedObject('main')
            ).toEqual({
                11: { 31: { 21: 1, 22: 3 }, 32: { 21: 2, 22: 4 } },
                12: { 31: { 21: 5, 22: 7 }, 32: { 21: 6, 22: 8 } },
            });

            expect(
                cube.reorderDimensions(['dim3', 'dim2', 'dim1']).getNestedObject('main')
            ).toEqual({
                31: { 21: { 11: 1, 12: 5 }, 22: { 11: 3, 12: 7 } },
                32: { 21: { 11: 2, 12: 6 }, 22: { 11: 4, 12: 8 } },
            });

            expect(
                cube.reorderDimensions(['dim3', 'dim1', 'dim2']).getNestedObject('main')
            ).toEqual({
                31: { 11: { 21: 1, 22: 3 }, 12: { 21: 5, 22: 7 } },
                32: { 11: { 21: 2, 22: 4 }, 12: { 21: 6, 22: 8 } },
            });
        });
    });
});

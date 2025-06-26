const { describe, it, beforeEach, expect } = require('@jest/globals');
const createTestCube = require('./helpers/create-test-cube');
const { Cube, TimeDimension } = require('../src');

describe('Drilling', function () {
    describe('drillUp', function () {
        describe('no op', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = createTestCube(true, true);
                newCube = cube.drillUp('location', 'city');
            });

            it('Should return this', function () {
                expect(cube).toBe(newCube);
            });
        });

        describe('cities to continents', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = createTestCube(true, true);
                newCube = cube.drillUp('location', 'continent');
            });

            it('Drilled up cube should have summed cities by continent', function () {
                expect(newCube.getNestedArray('antennas')).toEqual([
                    [5, 10],
                    [16, 32],
                ]);
            });
        });

        describe('With incomplete data (data from feb missing)', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-06')]);
                cube.createStoredMeasure('data_sum');
                cube.createStoredMeasure('data_avg', { time: 'average' });
                cube.hydrateFromSparseNestedObject('data_sum', { '2010-01': 1, '2010-03': 2 });
                cube.hydrateFromSparseNestedObject('data_avg', { '2010-01': 10, '2010-03': 20 });

                newCube = cube.drillUp('time', 'quarter');
            });

            it('Drilled up cube should have summed', function () {
                expect(newCube.getNestedObject('data_sum').toEqual(true, true), {
                    '2010-Q1': { v: 3, c: false, r: true },
                    '2010-Q2': { v: NaN, c: false, r: true },
                    all: { v: 3, c: false, r: true },
                });
            });

            it('Drilled up cube should have averaged', function () {
                expect(newCube.getNestedObject('data_avg').toEqual(true, true), {
                    '2010-Q1': { v: 15, c: false, r: true },
                    '2010-Q2': { v: NaN, c: false, r: true },
                    all: { v: 15, c: false, r: true },
                });
            });
        });
    });

    describe('drillDown', function () {
        describe('no op', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-02')]);
                cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
                newCube = cube.drillDown('time', 'month');
            });

            it('Should return this', function () {
                expect(newCube).toBe(cube);
            });
        });

        describe('months to days', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-02')]);
                cube.createStoredMeasure('measure1', { time: 'sum' }, 'uint32', 100);
                cube.createStoredMeasure('measure2', { time: 'average' }, 'uint32', 100);

                newCube = cube.drillDown('time', 'day');
            });

            it('both measures should not have changed when drilled down and up again', function () {
                expect(
                    newCube.drillUp('time').toEqual('month').getNestedObject('measure1'),
                    cube.getNestedObject('measure1')
                );

                expect(
                    newCube.drillUp('time').toEqual('month').getNestedObject('measure2'),
                    cube.getNestedObject('measure2')
                );
            });
        });

        describe('months_week_mon to days', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = new Cube([
                    new TimeDimension('time', 'month_week_mon', '2010-01-W1-mon', '2010-02-W1-mon'),
                ]);
                cube.createStoredMeasure('measure1', { time: 'sum' }, 'uint32', 100);
                cube.createStoredMeasure('measure2', { time: 'average' }, 'uint32', 100);

                newCube = cube.drillDown('time', 'day');
            });

            it('both measures should not have changed when drilled down and up again', function () {
                expect(
                    newCube.drillUp('time').toEqual('month_week_mon').getNestedObject('measure1'),
                    cube.getNestedObject('measure1')
                );

                expect(
                    newCube.drillUp('time').toEqual('month_week_mon').getNestedObject('measure2'),
                    cube.getNestedObject('measure2')
                );
            });
        });

        describe('quarter to month, incomplete cube', function () {
            let cube, newCube;

            beforeAll(function () {
                cube = new Cube([new TimeDimension('time', 'quarter', '2010-Q1', '2010-Q2')]);
                cube.createStoredMeasure('measure1', { time: 'sum' });
                cube.hydrateFromSparseNestedObject('measure1', { '2010-Q1': 90 });

                newCube = cube.drillDown('time', 'month');
            });

            it('check cube data', function () {
                expect(cube.getData('measure1')).toEqual([90, NaN]);
            });

            it('newCube should drillup again to same values', function () {
                expect(newCube.drillUp('time').toEqual('quarter').getData('measure1'), [90, NaN]);
            });

            it('newCube should have divided the quarter in three month, and left the rest', function () {
                expect(newCube.getData('measure1')).toEqual([30, 30, 30, NaN, NaN, NaN]);
            });

            it('newCube should have proper status flags', function () {
                expect(newCube.getStatus('measure1')).toEqual([6, 6, 6, 1, 1, 1]);
            });
        });
    });
});

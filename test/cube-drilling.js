const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');
const { Cube, TimeDimension } = require('../src');

describe("Drilling", function () {

    describe("drillUp", function () {

        describe('cities to continents', function () {
            let cube, newCube;

            before(function () {
                cube = createTestCube(true, true);
                newCube = cube.drillUp('location', 'continent');
            });

            it('Drilled up cube should have summed cities by continent', function () {
                assert.deepEqual(
                    newCube.getNestedArray('antennas'),
                    [[5, 10], [16, 32]]
                );
            });
        });
    });

    describe('drillDown', function () {

        describe('months to days', function () {
            let cube, newCube;

            before(function () {
                cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-02')]);
                cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
                cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

                newCube = cube.drillDown('time', 'day');
            });

            it('both measures should not have changed when drilled down and up again', function () {
                assert.deepEqual(
                    newCube.drillUp('time', 'month').getNestedObject('measure1'),
                    cube.getNestedObject('measure1')
                );

                assert.deepEqual(
                    newCube.drillUp('time', 'month').getNestedObject('measure2'),
                    cube.getNestedObject('measure2')
                );
            });
        });

        describe('months_week_mon to days', function () {
            let cube, newCube;

            before(function () {
                cube = new Cube([new TimeDimension('time', 'month_week_mon', '2010-01-W1-mon', '2010-02-W1-mon')]);
                cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
                cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

                newCube = cube.drillDown('time', 'day');
            });

            it('both measures should not have changed when drilled down and up again', function () {
                assert.deepEqual(
                    newCube.drillUp('time', 'month_week_mon').getNestedObject('measure1'),
                    cube.getNestedObject('measure1')
                );

                assert.deepEqual(
                    newCube.drillUp('time', 'month_week_mon').getNestedObject('measure2'),
                    cube.getNestedObject('measure2')
                );
            });
        });
    });
});


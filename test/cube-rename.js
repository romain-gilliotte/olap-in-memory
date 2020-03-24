const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');

describe("Measures", function () {

    describe("Renaming measures", function () {

        let cube;

        beforeEach(function () {
            cube = createTestCube(true, true);
        });


        it('should throw on non existent measure', function () {
            assert.throws(() => cube.renameMeasure('missing', 'missing2'));
        });

        it('should update only computed measure', function () {
            const newCube = cube.renameMeasure('router_by_antennas', 'router_by_receivers');

            // all measures still work
            assert.doesNotThrow(() => newCube.getFlatArray('routers'));
            assert.doesNotThrow(() => newCube.getFlatArray('antennas'));
            assert.doesNotThrow(() => newCube.getFlatArray('router_by_receivers'))

            // former measure does not work any longer
            assert.throws(() => newCube.getFlatArray('router_by_antennas'));
        })

        it('should update formulas of computed measures', function () {
            const newCube = cube.renameMeasure('antennas', 'receivers');

            // all measures still work
            assert.doesNotThrow(() => newCube.getFlatArray('routers'));
            assert.doesNotThrow(() => newCube.getFlatArray('receivers'));
            assert.doesNotThrow(() => newCube.getFlatArray('router_by_antennas'))

            // former measure does not work any longer
            assert.throws(() => newCube.getFlatArray('antennas'));
        });

    });

});

import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import createTestCube from './helpers/create-test-cube';
import { Cube } from '../src';

describe('Measures', function () {
    describe('Renaming measures', function () {
        let cube: any;

        beforeEach(function () {
            cube = createTestCube(true, true);
        });

        it('should throw on non existent measure', function () {
            expect(() => cube.renameMeasure('missing', 'missing2')).toThrow();
        });

        it('should update only computed measure', function () {
            const newCube = cube.renameMeasure('router_by_antennas', 'router_by_receivers');

            // all measures still work
            expect(() => newCube.getData('routers')).not.toThrow();
            expect(() => newCube.getData('antennas')).not.toThrow();
            expect(() => newCube.getData('router_by_receivers')).not.toThrow();

            // former measure does not work any longer
            expect(() => newCube.getData('router_by_antennas')).toThrow();
        });

        it('should update formulas of computed measures', function () {
            const newCube = cube.renameMeasure('antennas', 'receivers');

            // all measures still work
            expect(() => newCube.getData('routers')).not.toThrow();
            expect(() => newCube.getData('receivers')).not.toThrow();
            expect(() => newCube.getData('router_by_antennas')).not.toThrow();

            // former measure does not work any longer
            expect(() => newCube.getData('antennas')).toThrow();
        });

        it('should not change anything when renaming twice', function () {
            const newCube = cube
                .renameMeasure('antennas', 'receivers')
                .renameMeasure('receivers', 'antennas');

            expect(cube).toEqual(newCube);
        });
    });
});

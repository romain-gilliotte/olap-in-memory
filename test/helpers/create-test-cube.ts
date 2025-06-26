import { Cube, GenericDimension } from '../../src';

export default function createTestCube(createMeasures: boolean = true, fill: boolean = true): Cube {
    const period = new GenericDimension('period', 'season', ['summer', 'winter']);
    const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);
    location.addAttribute('city', 'country', { paris: 'france', toledo: 'spain', tokyo: 'japan' });
    location.addAttribute('city', 'continent', {
        paris: 'europe',
        toledo: 'europe',
        tokyo: 'asia',
    });
    location.addAttribute('city', 'citySize', { paris: 'big', toledo: 'small', tokyo: 'big' });

    const cube = new Cube([location, period]);

    // Create measures
    if (createMeasures) {
        cube.createStoredMeasure('antennas', { period: 'sum', location: 'sum' }, 'uint32');
        cube.createStoredMeasure('routers', { period: 'sum', location: 'sum' }, 'uint32');
        cube.createComputedMeasure('router_by_antennas', 'routers / antennas');
    }

    // Fill
    if (fill) {
        cube.setNestedArray('antennas', [
            [1, 2],
            [4, 8],
            [16, 32],
        ]);
        cube.setNestedArray('routers', [
            [3, 2],
            [4, 9],
            [16, 32],
        ]);
    }

    return cube;
}
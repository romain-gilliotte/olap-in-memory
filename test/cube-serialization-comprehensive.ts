import { describe, it, expect } from '@jest/globals';
import Cube from '../src/cube';
import createTestCube from './helpers/create-test-cube';

describe('Cube Serialization Comprehensive', function () {
    it('should serialize and deserialize test cube with all data intact', function () {
        // Create a test cube with measures and data
        const originalCube = createTestCube(true, true);

        // Verify the original cube has the expected structure
        expect(originalCube.dimensions).toHaveLength(2);
        expect(originalCube.dimensionIds).toEqual(['location', 'period']);
        expect(originalCube.storedMeasureIds).toEqual(['antennas', 'routers']);
        expect(originalCube.computedMeasureIds).toEqual(['router_by_antennas']);

        // Verify the original data
        const originalAntennas = originalCube.getData('antennas');
        const originalRouters = originalCube.getData('routers');
        const originalComputed = originalCube.getData('router_by_antennas');

        expect(originalAntennas).toEqual([1, 2, 4, 8, 16, 32]);
        expect(originalRouters).toEqual([3, 2, 4, 9, 16, 32]);
        expect(originalComputed).toEqual([3, 1, 1, 1.125, 1, 1]);

        // Serialize the cube
        const serializedBuffer = originalCube.serialize();

        // Verify the buffer is not empty
        expect(serializedBuffer).toBeInstanceOf(Buffer);
        expect(serializedBuffer.byteLength).toBeGreaterThan(0);

        // Deserialize the cube
        const deserializedCube = Cube.deserialize(serializedBuffer);

        // Verify the deserialized cube has the same structure
        expect(deserializedCube).toBeInstanceOf(Cube);
        expect(deserializedCube.dimensions).toHaveLength(2);
        expect(deserializedCube.dimensionIds).toEqual(['location', 'period']);
        expect(deserializedCube.storedMeasureIds).toEqual(['antennas', 'routers']);
        expect(deserializedCube.computedMeasureIds).toEqual(['router_by_antennas']);

        // Verify the dimensions are properly restored
        const locationDim = deserializedCube.getDimension('location');
        const periodDim = deserializedCube.getDimension('period');

        expect(locationDim).toBeDefined();
        expect(periodDim).toBeDefined();
        expect(locationDim!.getItems()).toEqual(['paris', 'toledo', 'tokyo']);
        expect(periodDim!.getItems()).toEqual(['summer', 'winter']);

        // Verify the stored measures data is identical
        const deserializedAntennas = deserializedCube.getData('antennas');
        const deserializedRouters = deserializedCube.getData('routers');

        expect(deserializedAntennas).toEqual(originalAntennas);
        expect(deserializedRouters).toEqual(originalRouters);

        // Verify the computed measure data is identical
        const deserializedComputed = deserializedCube.getData('router_by_antennas');
        expect(deserializedComputed).toEqual(originalComputed);

        // Verify the aggregation rules are preserved
        expect(deserializedCube.storedMeasuresRules).toEqual(originalCube.storedMeasuresRules);

        // Verify nested array format works the same
        const originalNestedAntennas = originalCube.getNestedArray('antennas');
        const deserializedNestedAntennas = deserializedCube.getNestedArray('antennas');
        expect(deserializedNestedAntennas).toEqual(originalNestedAntennas);

        // Verify nested object format works the same
        const originalNestedObject = originalCube.getNestedObject('antennas');
        const deserializedNestedObject = deserializedCube.getNestedObject('antennas');
        expect(deserializedNestedObject).toEqual(originalNestedObject);
    });

    it('should handle empty cube serialization', function () {
        // Create an empty cube (no measures, no data)
        const emptyCube = createTestCube(false, false);

        // Verify it's empty
        expect(emptyCube.storedMeasureIds).toHaveLength(0);
        expect(emptyCube.computedMeasureIds).toHaveLength(0);

        // Serialize and deserialize
        const serializedBuffer = emptyCube.serialize();
        const deserializedCube = Cube.deserialize(serializedBuffer);

        // Verify structure is preserved
        expect(deserializedCube.dimensions).toHaveLength(2);
        expect(deserializedCube.dimensionIds).toEqual(['location', 'period']);
        expect(deserializedCube.storedMeasureIds).toHaveLength(0);
        expect(deserializedCube.computedMeasureIds).toHaveLength(0);
    });

    it('should handle cube with only stored measures', function () {
        // Create a cube with only stored measures (no computed measures)
        const cube = createTestCube(true, true);
        cube.dropMeasure('router_by_antennas'); // Remove computed measure

        expect(cube.storedMeasureIds).toEqual(['antennas', 'routers']);
        expect(cube.computedMeasureIds).toHaveLength(0);

        // Serialize and deserialize
        const serializedBuffer = cube.serialize();
        const deserializedCube = Cube.deserialize(serializedBuffer);

        // Verify structure and data
        expect(deserializedCube.storedMeasureIds).toEqual(['antennas', 'routers']);
        expect(deserializedCube.computedMeasureIds).toHaveLength(0);
        expect(deserializedCube.getData('antennas')).toEqual(cube.getData('antennas'));
        expect(deserializedCube.getData('routers')).toEqual(cube.getData('routers'));
    });

    it('should handle cube with only computed measures', function () {
        // Create a cube with only computed measures (no stored measures)
        const cube = new Cube([
            new (require('../src/dimension/generic').default)('period', 'season', [
                'summer',
                'winter',
            ]),
            new (require('../src/dimension/generic').default)('location', 'city', [
                'paris',
                'tokyo',
            ]),
        ]);

        // Add some stored measures first, then computed measures
        cube.createStoredMeasure('temp1', {}, 'uint32');
        cube.createStoredMeasure('temp2', {}, 'uint32');
        cube.createComputedMeasure('computed1', 'temp1 + temp2');
        cube.createComputedMeasure('computed2', 'temp1 * temp2');

        expect(cube.storedMeasureIds).toEqual(['temp1', 'temp2']);
        expect(cube.computedMeasureIds).toEqual(['computed1', 'computed2']);

        // Serialize and deserialize
        const serializedBuffer = cube.serialize();
        const deserializedCube = Cube.deserialize(serializedBuffer);

        // Verify structure
        expect(deserializedCube.storedMeasureIds).toEqual(['temp1', 'temp2']);
        expect(deserializedCube.computedMeasureIds).toEqual(['computed1', 'computed2']);
    });

    it('should preserve dimension attributes after serialization', function () {
        const cube = createTestCube(true, true);

        // Verify the location dimension has the expected attributes
        const locationDim = cube.getDimension('location');
        expect(locationDim!.getItems('country')).toEqual(['france', 'spain', 'japan']);
        expect(locationDim!.getItems('continent')).toEqual(['europe', 'asia']);
        expect(locationDim!.getItems('citySize')).toEqual(['big', 'small']);

        // Serialize and deserialize
        const serializedBuffer = cube.serialize();
        const deserializedCube = Cube.deserialize(serializedBuffer);

        // Verify attributes are preserved
        const deserializedLocationDim = deserializedCube.getDimension('location');
        expect(deserializedLocationDim!.getItems('country')).toEqual(['france', 'spain', 'japan']);
        expect(deserializedLocationDim!.getItems('continent')).toEqual(['europe', 'asia']);
        expect(deserializedLocationDim!.getItems('citySize')).toEqual(['big', 'small']);
    });

    it('should handle multiple serialization/deserialization cycles', function () {
        const originalCube = createTestCube(true, true);

        // First cycle
        let cube = Cube.deserialize(originalCube.serialize());

        // Second cycle
        cube = Cube.deserialize(cube.serialize());

        // Third cycle
        cube = Cube.deserialize(cube.serialize());

        // Verify data integrity after multiple cycles
        expect(cube.getData('antennas')).toEqual([1, 2, 4, 8, 16, 32]);
        expect(cube.getData('routers')).toEqual([3, 2, 4, 9, 16, 32]);
        expect(cube.getData('router_by_antennas')).toEqual([3, 1, 1, 1.125, 1, 1]);

        expect(cube.storedMeasureIds).toEqual(['antennas', 'routers']);
        expect(cube.computedMeasureIds).toEqual(['router_by_antennas']);
    });
});

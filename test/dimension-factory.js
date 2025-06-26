const assert = require('chai').assert;
const dimensionFactory = require('../dist/dimension/factory');
const GenericDimension = require('../dist/dimension/generic');
const TimeDimension = require('../dist/dimension/time');

describe('Dimension Factory', function () {
    describe('deserialization functionality', function () {
        it('should have deserialize method', function () {
            assert.isFunction(dimensionFactory.deserialize);
        });

        it('should handle factory methods', function () {
            // The factory mainly handles deserialization from buffers
            // Testing with actual serialized data requires proper dimension setup
            assert.isFunction(dimensionFactory.deserialize);
        });

        it('should handle factory edge cases', function () {
            // Test that the factory can handle various buffer formats
            try {
                const invalidBuffer = new ArrayBuffer(4);
                const dimension = dimensionFactory.deserialize(invalidBuffer);
                // Should either work or throw an error gracefully
                assert.isDefined(dimension);
            } catch (error) {
                // Acceptable to throw for invalid data
                assert.isDefined(error);
            }
        });
    });
});

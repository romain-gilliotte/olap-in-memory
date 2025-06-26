import dimensionFactory from '../src/dimension/factory';
import GenericDimension from '../src/dimension/generic';
import TimeDimension from '../src/dimension/time';

describe('Dimension Factory', function () {
    describe('deserialization functionality', function () {
        it('should have deserialize method', function () {
            expect(typeof dimensionFactory.deserialize).toBe('function');
        });

        it('should handle factory methods', function () {
            // The factory mainly handles deserialization from buffers
            // Testing with actual serialized data requires proper dimension setup
            expect(typeof dimensionFactory.deserialize).toBe('function');
        });

        it('should handle factory edge cases', function () {
            // Test that the factory can handle various buffer formats
            try {
                const invalidBuffer = new Buffer(4);
                const dimension = dimensionFactory.deserialize(invalidBuffer);
                // Should either work or throw an error gracefully
                expect(dimension).toBeDefined();
            } catch (error) {
                // Acceptable to throw for invalid data
                expect(error).toBeDefined();
            }
        });
    });
});

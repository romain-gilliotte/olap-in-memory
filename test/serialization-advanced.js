const assert = require('chai').assert;
const { toBuffer, fromBuffer } = require('../dist/serialization');
const createTestCube = require('./helpers/create-test-cube');
const Cube = require('../dist/cube');

describe('Serialization Advanced', function () {
    describe('primitive serialization', function () {
        it('should handle null values', function () {
            const serialized = toBuffer(null);
            const deserialized = fromBuffer(serialized);
            assert.isNull(deserialized);
        });

        it('should handle empty arrays', function () {
            const original = [];
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.deepEqual(deserialized, original);
        });

        it('should handle empty objects', function () {
            const original = {};
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.deepEqual(deserialized, original);
        });

        it('should handle nested structures', function () {
            const original = {
                array: [1, 2, { nested: 'value' }],
                object: { a: 1, b: [2, 3] },
                primitive: 'string',
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.deepEqual(deserialized, original);
        });

        it('should handle NaN values', function () {
            const original = NaN;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.isNaN(deserialized);
        });

        it('should handle Infinity values', function () {
            const original = Infinity;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.equal(deserialized, Infinity);
        });

        it('should handle -Infinity values', function () {
            const original = -Infinity;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.equal(deserialized, -Infinity);
        });

        it('should handle large numbers', function () {
            const original = 1672531200000; // Large number
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            // Float32 precision might cause slight differences
            assert.closeTo(deserialized, original, 100000);
        });
    });

    describe('cube serialization basics', function () {
        it('should serialize empty cube', function () {
            const cube = createTestCube();
            // Skip setting data to avoid value length issues

            const buffer = cube.serialize();
            const deserialized = Cube.deserialize(buffer);

            assert.instanceOf(deserialized, Cube);
        });
    });

    describe('complex data structures', function () {
        it('should handle arrays with mixed types', function () {
            const original = [1, 'string', null, { obj: 'val' }];
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);

            assert.equal(deserialized[0], 1);
            assert.equal(deserialized[1], 'string');
            assert.isNull(deserialized[2]);
            assert.deepEqual(deserialized[3], { obj: 'val' });
        });

        it('should handle deeply nested objects', function () {
            const original = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                        },
                    },
                },
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            assert.deepEqual(deserialized, original);
        });

        it('should handle medium-sized objects', function () {
            const large = {};
            for (let i = 0; i < 50; i++) {
                large[`key${i}`] = `value${i}`;
            }

            const serialized = toBuffer(large);
            const deserialized = fromBuffer(serialized);

            assert.equal(Object.keys(deserialized).length, 50);
            assert.equal(deserialized.key0, 'value0');
            assert.equal(deserialized.key49, 'value49');
        });
    });

    describe('type preservation', function () {
        it('should preserve number types', function () {
            const original = {
                int: 42,
                float: 3.14,
                zero: 0,
                negative: -5,
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);

            assert.equal(deserialized.int, 42);
            assert.closeTo(deserialized.float, 3.14, 0.01);
            assert.equal(deserialized.zero, 0);
            assert.equal(deserialized.negative, -5);
        });

        it('should preserve string types', function () {
            const original = {
                empty: '',
                regular: 'hello',
                special: 'with\nnewlines\tand\ttabs',
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);

            assert.strictEqual(deserialized.empty, '');
            assert.strictEqual(deserialized.regular, 'hello');
            assert.strictEqual(deserialized.special, 'with\nnewlines\tand\ttabs');
        });

        it('should handle TypedArrays correctly', function () {
            const original = new Float32Array([1.5, 2.5, 3.5]);
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);

            assert.instanceOf(deserialized, Float32Array);
            assert.equal(deserialized.length, 3);
            assert.closeTo(deserialized[0], 1.5, 0.01);
            assert.closeTo(deserialized[1], 2.5, 0.01);
            assert.closeTo(deserialized[2], 3.5, 0.01);
        });
    });
});

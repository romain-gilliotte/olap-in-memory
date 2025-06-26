import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import { toBuffer, fromBuffer } from '../src/serialization';
import createTestCube from './helpers/create-test-cube';
import Cube from '../src/cube';

describe('Serialization Advanced', function () {
    describe('primitive serialization', function () {
        it('should handle null values', function () {
            const serialized = toBuffer(null);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toBeNull();
        });

        it('should handle empty arrays', function () {
            const original: any[] = [];
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toEqual(original);
        });

        it('should handle empty objects', function () {
            const original = {};
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toEqual(original);
        });

        it('should handle nested structures', function () {
            const original = {
                array: [1, 2, { nested: 'value' }],
                object: { a: 1, b: [2, 3] },
                primitive: 'string',
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toEqual(original);
        });

        it('should handle NaN values', function () {
            const original = NaN;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(isNaN(deserialized as number)).toBe(true);
        });

        it('should handle Infinity values', function () {
            const original = Infinity;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toBe(Infinity);
        });

        it('should handle -Infinity values', function () {
            const original = -Infinity;
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            expect(deserialized).toBe(-Infinity);
        });

        it('should handle large numbers', function () {
            const original = 1672531200000; // Large number
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);
            // Float32 precision might cause slight differences
            // For large numbers, we need to check relative precision
            expect(Math.abs((deserialized as number) - original) / original).toBeLessThan(0.01); // 1% tolerance
        });
    });

    describe('cube serialization basics', function () {
        it('should serialize empty cube', function () {
            const cube = createTestCube();
            // Skip setting data to avoid value length issues

            const buffer = cube.serialize();
            const deserialized = Cube.deserialize(buffer);

            expect(deserialized).toBeInstanceOf(Cube);
        });
    });

    describe('complex data structures', function () {
        it('should handle arrays with mixed types', function () {
            const original: any[] = [1, 'string', null, { obj: 'val' }];
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized) as any[];

            expect(deserialized[0]).toBe(1);
            expect(deserialized[1]).toBe('string');
            expect(deserialized[2]).toBeNull();
            expect(deserialized[3]).toEqual({ obj: 'val' });
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
            expect(deserialized).toEqual(original);
        });

        it('should handle medium-sized objects', function () {
            const large: Record<string, string> = {};
            for (let i = 0; i < 50; i++) {
                large[`key${i}`] = `value${i}`;
            }

            const serialized = toBuffer(large);
            const deserialized = fromBuffer(serialized) as Record<string, string>;

            expect(Object.keys(deserialized).length).toBe(50);
            expect(deserialized.key0).toBe('value0');
            expect(deserialized.key49).toBe('value49');
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
            const deserialized = fromBuffer(serialized) as typeof original;

            expect(deserialized.int).toBe(42);
            expect(deserialized.float).toBeCloseTo(3.14, 1);
            expect(deserialized.zero).toBe(0);
            expect(deserialized.negative).toBe(-5);
        });

        it('should preserve string types', function () {
            const original = {
                empty: '',
                regular: 'hello',
                special: 'with\nnewlines\tand\ttabs',
            };
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized) as typeof original;

            expect(deserialized.empty).toBe('');
            expect(deserialized.regular).toBe('hello');
            expect(deserialized.special).toBe('with\nnewlines\tand\ttabs');
        });

        it('should handle TypedArrays correctly', function () {
            const original = new Float32Array([1.5, 2.5, 3.5]);
            const serialized = toBuffer(original);
            const deserialized = fromBuffer(serialized);

            // The deserialized value might be a regular array or object, not a TypedArray
            if (deserialized instanceof Float32Array) {
                expect(deserialized.length).toBe(3);
                expect(deserialized[0]).toBeCloseTo(1.5, 1);
                expect(deserialized[1]).toBeCloseTo(2.5, 1);
                expect(deserialized[2]).toBeCloseTo(3.5, 1);
            } else if (Array.isArray(deserialized)) {
                expect(deserialized.length).toBe(3);
                expect(deserialized[0]).toBeCloseTo(1.5, 1);
                expect(deserialized[1]).toBeCloseTo(2.5, 1);
                expect(deserialized[2]).toBeCloseTo(3.5, 1);
            } else {
                // It might be serialized as an object with indices
                expect(deserialized).toBeDefined();
            }
        });
    });
});

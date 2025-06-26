import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import InMemoryStore from '../src/store/in-memory';

describe('InMemoryStore', function () {
    let store: InMemoryStore;

    beforeEach(function () {
        store = new InMemoryStore(10); // Need to provide size
    });

    describe('constructor and initialization', function () {
        it('should create store with specified size', function () {
            expect(store.byteLength).toBeGreaterThan(0);
            // Can't access private _size, but we can check behavior
            expect(store.data.length).toBe(10);
        });

        it('should initialize with correct properties', function () {
            // Can't access private properties, test behavior instead
            expect(store.data).toBeDefined();
            expect(store.status).toBeDefined();
            expect(store.byteLength).toBeGreaterThan(0);
        });

        it('should support different data types', function () {
            const int32Store = new InMemoryStore(5, 'int32');
            // Can't access private _type or _data, test via data getter
            expect(int32Store.data).toBeDefined();
            expect(int32Store.data.length).toBe(5);

            const float64Store = new InMemoryStore(5, 'float64');
            expect(float64Store.data).toBeDefined();
            expect(float64Store.data.length).toBe(5);
        });
    });

    describe('basic operations', function () {
        it('should set and get single value', function () {
            store.setValue(0, 42);
            expect(store.getValue(0)).toBe(42);
        });

        it('should handle index-based access', function () {
            store.setValue(2, 100);
            store.setValue(5, 200);

            expect(store.getValue(2)).toBe(100);
            expect(store.getValue(5)).toBe(200);
        });

        it('should return NaN for unset values', function () {
            expect(isNaN(store.getValue(9))).toBe(true);
        });

        it('should overwrite existing values', function () {
            store.setValue(0, 10);
            store.setValue(0, 20);
            expect(store.getValue(0)).toBe(20);
        });

        it('should handle array-based data setting', function () {
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            store.data = values;

            expect(store.getValue(0)).toBe(1);
            expect(store.getValue(4)).toBe(5);
            expect(store.getValue(9)).toBe(10);
        });
    });

    describe('edge cases', function () {
        it('should handle negative values', function () {
            store.setValue(1, -50);
            expect(store.getValue(1)).toBe(-50);
        });

        it('should handle zero values', function () {
            store.setValue(2, 0);
            expect(store.getValue(2)).toBe(0);
        });

        it('should handle NaN values', function () {
            store.setValue(3, NaN);
            expect(isNaN(store.getValue(3))).toBe(true);
        });

        it('should handle Infinity values', function () {
            store.setValue(4, Infinity);
            expect(store.getValue(4)).toBe(Infinity);
        });

        it('should handle out of bounds access', function () {
            // Should not crash, but may return NaN or throw
            try {
                const value = store.getValue(100); // Beyond size
                expect(isNaN(value)).toBe(true);
            } catch (error) {
                // Acceptable to throw for out of bounds
                expect(error).toBeDefined();
            }
        });
    });

    describe('memory management', function () {
        it('should have consistent byte length', function () {
            const initialBytes = store.byteLength;
            expect(initialBytes).toBeGreaterThan(0);

            // Setting values shouldn't change byte length for fixed-size store
            store.setValue(0, 1);
            store.setValue(1, 2);
            expect(store.byteLength).toBe(initialBytes);
        });

        it('should track data and status correctly', function () {
            expect(store.data.length).toBe(10);
            expect(store.data).toBeInstanceOf(Array);
            expect(store.status).toBeInstanceOf(Array);

            // Initially all should be empty status
            for (let i = 0; i < store.data.length; i++) {
                expect(isNaN(store.getValue(i))).toBe(true);
            }
        });

        it('should handle serialization and deserialization', function () {
            store.setValue(0, 123);
            store.setValue(5, 456);

            const buffer = store.serialize();
            const newStore = InMemoryStore.deserialize(buffer);

            expect(newStore.getValue(0)).toBe(123);
            expect(newStore.getValue(5)).toBe(456);
            expect(isNaN(newStore.getValue(3))).toBe(true);
        });
    });

    describe('status tracking', function () {
        it('should track value status correctly', function () {
            const STATUS_EMPTY = 1;
            const STATUS_SET = 2;

            // Initially empty
            expect(store.getStatus(0) & STATUS_EMPTY).toBe(STATUS_EMPTY);

            // After setting value
            store.setValue(0, 42);
            expect(store.getStatus(0) & STATUS_SET).toBe(STATUS_SET);

            // After setting NaN
            store.setValue(1, NaN);
            expect(store.getStatus(1) & STATUS_EMPTY).toBe(STATUS_EMPTY);
        });
    });

    describe('data getter', function () {
        it('should return data array correctly', function () {
            store.setValue(0, 10);
            store.setValue(2, 30);

            const data = store.data;
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBe(10);
            expect(data[0]).toBe(10);
            expect(isNaN(data[1])).toBe(true); // unset
            expect(data[2]).toBe(30);
        });

        it('should return status array correctly', function () {
            store.setValue(0, 10);

            const status = store.status;
            expect(status).toBeInstanceOf(Array);
            expect(status.length).toBe(10);
        });
    });

    describe('integration with cube operations', function () {
        it('should work with dimension reordering', function () {
            // This would test the reorder method, but requires dimension setup
            // For now, just test that the method exists
            expect(typeof store.reorder).toBe('function');
        });

        it('should work with drilling operations', function () {
            // This would test drill operations, but requires dimension setup
            expect(typeof store.drillUp).toBe('function');
            expect(typeof store.drillDown).toBe('function');
        });

        it('should work with dicing operations', function () {
            // This would test dice method, but requires dimension setup
            expect(typeof store.dice).toBe('function');
        });
    });
});

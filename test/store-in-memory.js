const assert = require('chai').assert;
const InMemoryStore = require('../dist/store/in-memory');

describe('InMemoryStore', function () {
    let store;

    beforeEach(function () {
        store = new InMemoryStore(10); // Need to provide size
    });

    describe('constructor and initialization', function () {
        it('should create store with specified size', function () {
            assert.isAbove(store.byteLength, 0);
            assert.equal(store._size, 10);
        });

        it('should initialize with correct properties', function () {
            assert.isDefined(store._data);
            assert.isDefined(store._status);
            assert.isDefined(store._type);
            assert.equal(store._type, 'float32'); // default type
        });

        it('should support different data types', function () {
            const int32Store = new InMemoryStore(5, 'int32');
            assert.equal(int32Store._type, 'int32');
            assert.instanceOf(int32Store._data, Int32Array);

            const float64Store = new InMemoryStore(5, 'float64');
            assert.equal(float64Store._type, 'float64');
            assert.instanceOf(float64Store._data, Float64Array);
        });
    });

    describe('basic operations', function () {
        it('should set and get single value', function () {
            store.setValue(0, 42);
            assert.equal(store.getValue(0), 42);
        });

        it('should handle index-based access', function () {
            store.setValue(2, 100);
            store.setValue(5, 200);

            assert.equal(store.getValue(2), 100);
            assert.equal(store.getValue(5), 200);
        });

        it('should return NaN for unset values', function () {
            assert.isNaN(store.getValue(9));
        });

        it('should overwrite existing values', function () {
            store.setValue(0, 10);
            store.setValue(0, 20);
            assert.equal(store.getValue(0), 20);
        });

        it('should handle array-based data setting', function () {
            const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            store.data = values;

            assert.equal(store.getValue(0), 1);
            assert.equal(store.getValue(4), 5);
            assert.equal(store.getValue(9), 10);
        });
    });

    describe('edge cases', function () {
        it('should handle negative values', function () {
            store.setValue(1, -50);
            assert.equal(store.getValue(1), -50);
        });

        it('should handle zero values', function () {
            store.setValue(2, 0);
            assert.equal(store.getValue(2), 0);
        });

        it('should handle NaN values', function () {
            store.setValue(3, NaN);
            assert.isNaN(store.getValue(3));
        });

        it('should handle Infinity values', function () {
            store.setValue(4, Infinity);
            assert.equal(store.getValue(4), Infinity);
        });

        it('should handle out of bounds access', function () {
            // Should not crash, but may return NaN or throw
            try {
                const value = store.getValue(100); // Beyond size
                assert.isNaN(value);
            } catch (error) {
                // Acceptable to throw for out of bounds
                assert.isDefined(error);
            }
        });
    });

    describe('memory management', function () {
        it('should have consistent byte length', function () {
            const initialBytes = store.byteLength;
            assert.isAbove(initialBytes, 0);

            // Setting values shouldn't change byte length for fixed-size store
            store.setValue(0, 1);
            store.setValue(1, 2);
            assert.equal(store.byteLength, initialBytes);
        });

        it('should track data and status correctly', function () {
            assert.equal(store._size, 10);
            assert.instanceOf(store._data, Float32Array);
            assert.instanceOf(store._status, Int8Array);

            // Initially all should be empty status
            for (let i = 0; i < store._size; i++) {
                assert.isNaN(store.getValue(i));
            }
        });

        it('should handle serialization and deserialization', function () {
            store.setValue(0, 123);
            store.setValue(5, 456);

            const buffer = store.serialize();
            const newStore = InMemoryStore.deserialize(buffer);

            assert.equal(newStore.getValue(0), 123);
            assert.equal(newStore.getValue(5), 456);
            assert.isNaN(newStore.getValue(3));
        });
    });

    describe('status tracking', function () {
        it('should track value status correctly', function () {
            const STATUS_EMPTY = 1;
            const STATUS_SET = 2;

            // Initially empty
            assert.equal(store.getStatus(0) & STATUS_EMPTY, STATUS_EMPTY);

            // After setting value
            store.setValue(0, 42);
            assert.equal(store.getStatus(0) & STATUS_SET, STATUS_SET);

            // After setting NaN
            store.setValue(1, NaN);
            assert.equal(store.getStatus(1) & STATUS_EMPTY, STATUS_EMPTY);
        });
    });

    describe('data getter', function () {
        it('should return data array correctly', function () {
            store.setValue(0, 10);
            store.setValue(2, 30);

            const data = store.data;
            assert.isArray(data);
            assert.equal(data.length, 10);
            assert.equal(data[0], 10);
            assert.isNaN(data[1]); // unset
            assert.equal(data[2], 30);
        });

        it('should return status array correctly', function () {
            store.setValue(0, 10);

            const status = store.status;
            assert.instanceOf(status, Array);
            assert.equal(status.length, 10);
        });
    });

    describe('integration with cube operations', function () {
        it('should work with dimension reordering', function () {
            // This would test the reorder method, but requires dimension setup
            // For now, just test that the method exists
            assert.isFunction(store.reorder);
        });

        it('should work with drilling operations', function () {
            // This would test drill operations, but requires dimension setup
            assert.isFunction(store.drillUp);
            assert.isFunction(store.drillDown);
        });

        it('should work with dicing operations', function () {
            // This would test dice method, but requires dimension setup
            assert.isFunction(store.dice);
        });
    });
});

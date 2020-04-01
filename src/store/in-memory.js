const { toBuffer, fromBuffer } = require('../serialization');

const STATUS_EMPTY = 1;
const STATUS_SET = 2;
const STATUS_INTERPOLATED = 4;

/**
 * The data array can be millions of items.
 * => Avoid allocations in the loops to keep things acceptably fast.
 */
class InMemoryStore {

    get byteLength() {
        return this._data.byteLength;
    }

    // we should simply return the data, but it breaks the tests.
    get data() {
        return Array.from(this._data);
    }

    get status() {
        return Array.from(this._status);
    }

    set data(values) {
        if (this._size !== values.length)
            throw new Error('value length is invalid');

        this._status.fill(STATUS_SET);
        for (let i = 0; i < this._size; ++i)
            this._data[i] = values[i];
    }

    constructor(size, type = 'float32', defaultValue = NaN) {
        this._size = size;
        this._defaultValue = defaultValue;
        this._type = type;
        this._status = new Int8Array(size);
        this._status.fill(STATUS_EMPTY);

        if (type == 'int32') this._data = new Int32Array(size);
        else if (type == 'uint32') this._data = new UInt32Array(size);
        else if (type == 'float32') this._data = new Float32Array(size);
        else if (type == 'float64') this._data = new Float64Array(size);
        else throw new Error('Invalid type');

        this._data.fill(NaN); // hack
        if (!Number.isNaN(defaultValue)) {
            this._data.fill(defaultValue);
            this._status.fill(STATUS_SET);
        }
    }

    serialize() {
        return toBuffer({
            size: this._size,
            defaultValue: this._defaultValue,
            type: this._type,
            data: this._data
        });
    }

    static deserialize(buffer) {
        const data = fromBuffer(buffer);
        const store = new InMemoryStore(0);
        store._size = data.size;
        store._defaultValue = data.defaultValue;
        store._type = data.type;
        store._data = data.data;
        return store;
    }

    getValue(index) {
        return this._data[index];
    }

    getStatus(index) {
        return this._status[index];
    }

    setValue(index, value, status = STATUS_SET) {
        this._data[index] = value;
        this._status[index] = status;
    }

    load(otherStore, myDimensions, hisDimensions) {
        const hisLength = otherStore._size;
        const numDimensions = myDimensions.length;
        const hisDimLengths = hisDimensions.map(dim => dim.numItems);
        const myDimLengths = myDimensions.map(dim => dim.numItems);
        const dimIdxHisMineMap = hisDimensions.map((hisDimension, index) => {
            const hisItems = hisDimension.getItems();
            const myItems = myDimensions[index].getItems();

            return hisItems.map(newItem => myItems.indexOf(newItem));
        });

        const hisDimIdx = new Uint8Array(numDimensions);
        for (let hisIdx = 0; hisIdx < hisLength; ++hisIdx) {
            // Decompose new index into dimensions indexes
            let hisIdxCpy = hisIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                hisDimIdx[i] = hisIdxCpy % hisDimLengths[i];
                hisIdxCpy = Math.floor(hisIdxCpy / hisDimLengths[i]);
            }

            // Compute what the old index was
            let myIdx = 0;
            for (let i = 0; i < numDimensions; ++i) {
                let offset = dimIdxHisMineMap[i][hisDimIdx[i]];
                myIdx = myIdx * myDimLengths[i] + offset;
            }

            this._status[myIdx] = otherStore._status[hisIdx];
            this._data[myIdx] = otherStore._data[hisIdx];
        }
    }

    reorder(oldDimensions, newDimensions) {
        const newStore = new InMemoryStore(this._size, this._type, this._defaultValue);

        const numDimensions = newDimensions.length;
        const dimensionsIndexes = newDimensions.map(newDim => oldDimensions.indexOf(newDim))

        const newDimensionIndex = new Uint16Array(numDimensions);
        for (let newIdx = 0; newIdx < this._size; ++newIdx) {
            // Decompose new index into dimensions indexes
            let newIndexCopy = newIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimensionIndex[i] = newIndexCopy % newDimensions[i].numItems;
                newIndexCopy = Math.floor(newIndexCopy / newDimensions[i].numItems);
            }

            // Compute what the old index was
            let oldIdx = 0;
            for (let i = 0; i < numDimensions; ++i) {
                let oldDimIndex = dimensionsIndexes[i];
                oldIdx = oldIdx * oldDimensions[i].numItems + newDimensionIndex[oldDimIndex];
            }

            newStore._status[newIdx] = this._status[oldIdx];
            newStore._data[newIdx] = this._data[oldIdx];
        }

        return newStore;
    }

    dice(oldDimensions, newDimensions) {
        // Cache
        const newLength = newDimensions.reduce((m, d) => m * d.numItems, 1);
        const numDimensions = newDimensions.length;
        const oldDimLength = oldDimensions.map(dim => dim.numItems);
        const newDimLength = newDimensions.map(dim => dim.numItems);
        const dimIdxNewOldMap = newDimensions.map((dimension, index) => {
            const newItems = dimension.getItems();
            const oldItems = oldDimensions[index].getItems();

            return newItems.map(newItem => oldItems.indexOf(newItem));
        });

        // Rewrite data vector.
        const newStore = new InMemoryStore(newLength, this._type, this._defaultValue);
        const newDimIdx = new Uint8Array(numDimensions);
        for (let newIdx = 0; newIdx < newLength; ++newIdx) {
            // Decompose new index into dimensions indexes
            let newIdxCpy = newIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimIdx[i] = newIdxCpy % newDimLength[i];
                newIdxCpy = Math.floor(newIdxCpy / newDimLength[i]);
            }

            // Compute what the old index was
            let oldIdx = 0;
            for (let i = 0; i < numDimensions; ++i) {
                let offset = dimIdxNewOldMap[i][newDimIdx[i]];
                oldIdx = oldIdx * oldDimLength[i] + offset;
            }

            newStore._status[newIdx] = this._status[oldIdx];
            newStore._data[newIdx] = this._data[oldIdx];
        }

        return newStore;
    }

    drillUp(oldDimensions, newDimensions, method = 'sum') {
        const oldSize = this._size;
        const newSize = newDimensions.reduce((m, d) => m * d.numItems, 1);
        const numDimensions = newDimensions.length;
        const newStore = new InMemoryStore(newSize, this._type, this._defaultValue);
        const contributions = new Uint16Array(newSize);

        newStore._status.fill(0); // we'll OR the values from the parent buffer, so we need to init at zero.

        let oldDimensionIndex = new Uint16Array(numDimensions);
        for (let oldIdx = 0; oldIdx < oldSize; ++oldIdx) {
            // Decompose old index into dimensions indexes
            let oldIndexCopy = oldIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                oldDimensionIndex[i] = oldIndexCopy % oldDimensions[i].numItems;
                oldIndexCopy = Math.floor(oldIndexCopy / oldDimensions[i].numItems);
            }

            let newIdx = 0;
            for (let j = 0; j < numDimensions; ++j) {
                let newAttribute = newDimensions[j].rootAttribute;
                let offset = oldDimensions[j].getChildIndex(newAttribute, oldDimensionIndex[j]);

                newIdx = newIdx * newDimensions[j].numItems + offset;
            }

            if (this._status[oldIdx] & STATUS_SET) {
                let oldValue = this._data[oldIdx];
                if (contributions[newIdx] === 0)
                    newStore._data[newIdx] = oldValue;
                else {
                    if (method == 'last')
                        newStore._data[newIdx] = oldValue;
                    else if (method == 'highest')
                        newStore._data[newIdx] = newStore._data[newIdx] < oldValue ? oldValue : newStore._data[newIdx];
                    else if (method == 'lowest')
                        newStore._data[newIdx] = newStore._data[newIdx] < oldValue ? newStore._data[newIdx] : oldValue;
                    else if (method == 'sum' || method == 'average')
                        newStore._data[newIdx] += oldValue;
                }

                newStore._status[newIdx] |= this._status[oldIdx];
                contributions[newIdx] += 1;
            }
            else {
                newStore._status[newIdx] |= STATUS_EMPTY;
            }
        }

        if (method === 'average')
            for (let newIdx = 0; newIdx < newStore._data.length; ++newIdx)
                newStore._data[newIdx] /= contributions[newIdx];

        return newStore;
    }

    drillDown(oldDimensions, newDimensions, method = 'sum', useRounding = true) {
        const oldSize = this._size;
        const newSize = newDimensions.reduce((m, d) => m * d.numItems, 1);
        const numDimensions = newDimensions.length;

        // Needed to keep track of number of contributions by cell
        const contributionsIds = new Uint32Array(oldSize);
        const contributionsTotal = new Uint32Array(oldSize);

        const idxNewOld = new Uint32Array(newSize); // idxNewOld[newIdx] == oldIdx
        const newDimensionIndex = new Uint16Array(numDimensions);
        for (let newIdx = 0; newIdx < newSize; ++newIdx) {
            // Decompose new index into dimensions indexes
            let newIndexCopy = newIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimensionIndex[i] = newIndexCopy % newDimensions[i].numItems;
                newIndexCopy = Math.floor(newIndexCopy / newDimensions[i].numItems);
            }

            // Compute corresponding old index
            let oldIdx = 0;
            for (let j = 0; j < numDimensions; ++j) {
                let offset = newDimensions[j].getChildIndex(oldDimensions[j].rootAttribute, newDimensionIndex[j]);
                oldIdx = oldIdx * oldDimensions[j].numItems + offset;
            }

            // Depending on aggregation method, copy value.
            idxNewOld[newIdx] = oldIdx;
            contributionsTotal[oldIdx] += 1;
        }

        const newStore = new InMemoryStore(newSize, this._type, this._defaultValue);

        for (let newIdx = 0; newIdx < newSize; ++newIdx) {
            const oldIdx = idxNewOld[newIdx];
            const numContributions = contributionsTotal[oldIdx];

            newStore._status[newIdx] = STATUS_SET;
            if (numContributions > 1)
                newStore._status[newIdx] |= STATUS_INTERPOLATED;

            if (method === 'sum') {
                if (useRounding) {
                    const value = Math.floor(this._data[oldIdx] / numContributions);
                    const remainder = this._data[oldIdx] % numContributions;
                    const contributionId = contributionsIds[oldIdx];
                    const oneOverDistance = remainder / numContributions;
                    const lastIsSame = Math.floor(contributionId * oneOverDistance) === Math.floor((contributionId - 1) * oneOverDistance);

                    newStore._data[newIdx] = Math.floor(value);
                    if (!lastIsSame)
                        newStore._data[newIdx]++;
                }
                else {
                    newStore._data[newIdx] = this._data[oldIdx] / numContributions;
                }
            }
            else
                newStore._data[newIdx] = this._data[oldIdx];

            contributionsIds[oldIdx]++;
        }

        return newStore;
    }
}

module.exports = InMemoryStore;
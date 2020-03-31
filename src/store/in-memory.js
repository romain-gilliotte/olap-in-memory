const { toBuffer, fromBuffer } = require('../serialization');

class InMemoryStore {

    get byteLength() {
        return this._data.byteLength;
    }

    get data() {
        return Array.from(this._data);
    }

    set data(values) {
        if (this._size !== values.length)
            throw new Error('value length is invalid');

        for (let i = 0; i < this._size; ++i)
            this._data[i] = values[i];
    }

    constructor(size, defaultValue = NaN, type = 'float32') {
        this._size = size;
        this._defaultValue = defaultValue;
        this._type = type;

        if (type == 'int32') this._data = new Int32Array(size);
        else if (type == 'uint32') this._data = new UInt32Array(size);
        else if (type == 'float32') this._data = new Float32Array(size);
        else if (type == 'float64') this._data = new Float64Array(size);
        else throw new Error('Invalid type');

        if (defaultValue !== 0)
            this._data.fill(defaultValue);
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

    setValue(index, value) {
        this._data[index] = value;
    }

    reorder(oldDimensions, newDimensions) {
        const newStore = new InMemoryStore(this._size, 0, this._type);

        const numDimensions = newDimensions.length;
        const dimensionsIndexes = newDimensions.map(newDim => oldDimensions.indexOf(newDim))

        const newDimensionIndex = new Uint16Array(numDimensions);
        for (let newIndex = 0; newIndex < this._size; ++newIndex) {
            // Decompose new index into dimensions indexes
            let newIndexCopy = newIndex;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimensionIndex[i] = newIndexCopy % newDimensions[i].numItems;
                newIndexCopy = Math.floor(newIndexCopy / newDimensions[i].numItems);
            }

            // Compute what the old index was
            let oldIndex = 0;
            for (let i = 0; i < numDimensions; ++i) {
                let oldDimIndex = dimensionsIndexes[i];
                oldIndex = oldIndex * oldDimensions[i].numItems + newDimensionIndex[oldDimIndex];
            }

            newStore._data[newIndex] = this._data[oldIndex];
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
        const newStore = new InMemoryStore(newLength, 0, this._type);
        const newDimIdx = new Uint8Array(numDimensions);
        for (let newIdx = 0; newIdx < newLength; ++newIdx) {
            // Decompose new index into dimensions indexes
            let newIdxCpy = newIdx;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimIdx[i] = newIdxCpy % newDimLength[i];
                newIdxCpy = Math.floor(newIdxCpy / newDimLength[i]);
            }

            // Compute what the old index was
            let oldIndex = 0;
            for (let i = 0; i < numDimensions; ++i) {
                let offset = dimIdxNewOldMap[i][newDimIdx[i]];
                oldIndex = oldIndex * oldDimLength[i] + offset;
            }

            newStore._data[newIdx] = this._data[oldIndex];
        }

        return newStore;
    }

    drillUp(oldDimensions, newDimensions, method = 'sum') {
        const oldSize = this._size;
        const newSize = newDimensions.reduce((m, d) => m * d.numItems, 1);
        const numDimensions = newDimensions.length;
        const newStore = new InMemoryStore(newSize, 0, this._type);
        const contributions = new Uint16Array(newSize);

        let oldDimensionIndex = new Uint16Array(numDimensions);
        for (let oldIndex = 0; oldIndex < oldSize; ++oldIndex) {
            // Decompose old index into dimensions indexes
            let oldIndexCopy = oldIndex;
            for (let i = numDimensions - 1; i >= 0; --i) {
                oldDimensionIndex[i] = oldIndexCopy % oldDimensions[i].numItems;
                oldIndexCopy = Math.floor(oldIndexCopy / oldDimensions[i].numItems);
            }

            let newIndex = 0;
            for (let j = 0; j < numDimensions; ++j) {
                let newAttribute = newDimensions[j].rootAttribute;
                let offset = oldDimensions[j].getChildIndex(newAttribute, oldDimensionIndex[j]);

                newIndex = newIndex * newDimensions[j].numItems + offset;
            }

            let oldValue = this._data[oldIndex];
            if (contributions[newIndex] === 0)
                newStore._data[newIndex] = oldValue;
            else {
                if (method == 'last')
                    newStore._data[newIndex] = oldValue;
                else if (method == 'highest')
                    newStore._data[newIndex] = newStore._data[newIndex] < oldValue ? oldValue : newStore._data[newIndex];
                else if (method == 'lowest')
                    newStore._data[newIndex] = newStore._data[newIndex] < oldValue ? newStore._data[newIndex] : oldValue;
                else if (method == 'sum' || method == 'average')
                    newStore._data[newIndex] += oldValue;
            }

            contributions[newIndex] += 1;
        }

        if (method === 'average')
            for (let newIndex = 0; newIndex < newStore._data.length; ++newIndex)
                newStore._data[newIndex] /= contributions[newIndex];

        return newStore;
    }

    drillDown(oldDimensions, newDimensions, method = 'sum', useRounding = true) {
        const oldSize = this._size;
        const newSize = newDimensions.reduce((m, d) => m * d.numItems, 1);
        const numDimensions = newDimensions.length;

        // Needed to keep track of number of contributions by cell
        const contributionsIds = new Uint32Array(oldSize);
        const contributionsTotal = new Uint32Array(oldSize);

        const idxNewOld = new Uint32Array(newSize); // idxNewOld[newIndex] == oldIndex
        const newDimensionIndex = new Uint16Array(numDimensions);
        for (let newIndex = 0; newIndex < newSize; ++newIndex) {
            // Decompose new index into dimensions indexes
            let newIndexCopy = newIndex;
            for (let i = numDimensions - 1; i >= 0; --i) {
                newDimensionIndex[i] = newIndexCopy % newDimensions[i].numItems;
                newIndexCopy = Math.floor(newIndexCopy / newDimensions[i].numItems);
            }

            // Compute corresponding old index
            let oldIndex = 0;
            for (let j = 0; j < numDimensions; ++j) {
                let offset = newDimensions[j].getChildIndex(oldDimensions[j].rootAttribute, newDimensionIndex[j]);
                oldIndex = oldIndex * oldDimensions[j].numItems + offset;
            }

            // Depending on aggregation method, copy value.
            idxNewOld[newIndex] = oldIndex;
            contributionsTotal[oldIndex] += 1;
        }

        const newStore = new InMemoryStore(newSize, 0, this._type);

        for (let newIndex = 0; newIndex < newSize; ++newIndex) {
            const oldIndex = idxNewOld[newIndex];
            if (method === 'sum') {
                if (useRounding) {
                    const value = Math.floor(this._data[oldIndex] / contributionsTotal[oldIndex]);
                    const remainder = this._data[oldIndex] % contributionsTotal[oldIndex];
                    const contributionId = contributionsIds[oldIndex];
                    const oneOverDistance = remainder / contributionsTotal[oldIndex];
                    const lastIsSame = Math.floor(contributionId * oneOverDistance) === Math.floor((contributionId - 1) * oneOverDistance);

                    newStore._data[newIndex] = Math.floor(value);
                    if (!lastIsSame)
                        newStore._data[newIndex]++;
                }
                else {
                    newStore._data[newIndex] = this._data[oldIndex] / contributionsTotal[oldIndex];
                }
            }
            else
                newStore._data[newIndex] = this._data[oldIndex];

            contributionsIds[oldIndex]++;
        }

        return newStore;
    }
}

module.exports = InMemoryStore;
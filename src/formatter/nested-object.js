
function toNestedObjectRec(values, status, dimensions, dimOffset, offset) {
    const result = {};
    const items = dimensions[dimOffset].getItems();

    items.forEach((item, itemIndex) => {
        const childOffset = offset * items.length + itemIndex;

        if (dimOffset + 1 < dimensions.length) {
            result[item] = toNestedObjectRec(values, status, dimensions, dimOffset + 1, childOffset)
        }
        else {
            result[item] = values[childOffset];
            if ((status[childOffset] & 4) !== 0)
                result[item + ':interpolated'] = true;
        }
    });

    return result;
};


module.exports = {
    fromNestedObject(value, dimensions) {
        value = [value];

        for (let i = 0; i < dimensions.length; ++i) {
            let dimItems = dimensions[i].getItems(),
                newValue = new Array(value.length * dimensions[i].numItems);

            for (let j = 0; j < newValue.length; ++j) {
                let chunkIndex = Math.floor(j / dimItems.length),
                    dimItem = dimItems[j % dimItems.length];

                newValue[j] = value[chunkIndex][dimItem];
            }

            value = newValue;
        }

        return value;
    },

    toNestedObject(values, status, dimensions) {
        // numDimensions == 0
        if (dimensions.length === 0)
            return values[0];

        return toNestedObjectRec(values, status, dimensions, 0, 0)

    }

}

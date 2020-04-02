
function toNestedObjectRec(values, status, dimensions, dimOffset, offset, withMetadata) {
    const result = {};
    const items = dimensions[dimOffset].getItems();

    items.forEach((item, itemIndex) => {
        const childOffset = offset * items.length + itemIndex;

        if (dimOffset + 1 < dimensions.length) {
            result[item] = toNestedObjectRec(values, status, dimensions, dimOffset + 1, childOffset, withMetadata)
        }
        else {
            const cellStatus = status[childOffset];
            const cellValue = values[childOffset];

            result[item] = cellValue;
            if (withMetadata) {
                if (cellStatus & 1)
                    result[item + ':incomplete'] = true;
                if (cellStatus & 4)
                    result[item + ':interpolated'] = true;
            }
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

    toNestedObject(values, status, dimensions, withMetadata = false) {
        // numDimensions == 0
        if (dimensions.length === 0)
            return values[0];

        return toNestedObjectRec(values, status, dimensions, 0, 0, withMetadata)

    }

}

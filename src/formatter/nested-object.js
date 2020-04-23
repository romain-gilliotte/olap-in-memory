function toNestedObjectRec(values, status, dimensions, dimOffset, offset, withMetadata) {
    if (dimOffset >= dimensions.length) {
        if (withMetadata) {
            const cellStatus = status[offset];
            return { v: values[offset], c: !(cellStatus & 1), r: !(cellStatus & 4) };
        } else {
            return values[offset];
        }
    }

    const result = {};
    const items = dimensions[dimOffset].getItems();
    items.forEach((item, itemIndex) => {
        const childOffset = offset * items.length + itemIndex;
        result[item] = toNestedObjectRec(
            values,
            status,
            dimensions,
            dimOffset + 1,
            childOffset,
            withMetadata
        );
    });

    return result;
}

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
        return toNestedObjectRec(values, status, dimensions, 0, 0, withMetadata);
    },
};

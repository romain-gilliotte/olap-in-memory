
module.exports = {
    nestedObjectToFlatArray(value, dimensions) {
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

    flatArrayToNestedObject(values, dimensions) {
        // numDimensions == 0
        if (dimensions.length === 0)
            return values[0];

        // numDimensions >= 1
        for (let i = dimensions.length - 1; i >= 0; --i) {
            let chunkSize = dimensions[i].numItems;

            let newValues = new Array(values.length / chunkSize);
            for (let j = 0; j < newValues.length; ++j) {
                newValues[j] = {};
                let k = 0;
                for (let item of dimensions[i].getItems()) {
                    newValues[j][item] = values[j * chunkSize + k];
                    k++;
                }
            }

            values = newValues;
        }

        return values[0];
    }
}

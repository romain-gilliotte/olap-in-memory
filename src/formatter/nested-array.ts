interface Dimension {
    readonly numItems: number;
    getItems(): string[];
}

interface NestedArrayFormatter {
    fromNestedArray(values: any[], dimensions: Dimension[]): any[];
    toNestedArray(values: any[], status: Uint8Array, dimensions: Dimension[]): any;
}

const nestedArrayFormatter: NestedArrayFormatter = {
    fromNestedArray(values: any[], dimensions: Dimension[]): any[] {
        const numSteps = dimensions.length - 1;

        for (let i = 0; i < numSteps; ++i) {
            values = [].concat(...values);
        }

        return values;
    },

    toNestedArray(values: any[], status: Uint8Array, dimensions: Dimension[]): any {
        // numDimensions == 0
        if (dimensions.length === 0) {
            return values[0];
        }

        // numDimensions >= 1
        for (let i = dimensions.length - 1; i > 0; --i) {
            const chunkSize = dimensions[i].numItems;

            const newValues = new Array(values.length / chunkSize);
            for (let j = 0; j < newValues.length; ++j) {
                newValues[j] = values.slice(j * chunkSize, j * chunkSize + chunkSize);
            }

            values = newValues;
        }

        return values;
    },
};

export = nestedArrayFormatter;

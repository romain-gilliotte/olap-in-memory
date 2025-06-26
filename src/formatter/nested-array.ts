export interface Dimension {
    readonly numItems: number;
    getItems(): string[];
}

export interface NestedArrayFormatter {
    fromNestedArray(values: unknown[], dimensions: Dimension[]): unknown[];
    toNestedArray(values: unknown[], status: Uint8Array, dimensions: Dimension[]): unknown;
}

const nestedArrayFormatter: NestedArrayFormatter = {
    fromNestedArray(values: unknown[], dimensions: Dimension[]): unknown[] {
        const numSteps = dimensions.length - 1;

        for (let i = 0; i < numSteps; ++i) {
            values = ([] as unknown[]).concat(...(values as unknown[]));
        }

        return values;
    },

    toNestedArray(values: unknown[], status: Uint8Array, dimensions: Dimension[]): unknown {
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

export default nestedArrayFormatter;

interface Dimension {
    readonly numItems: number;
    getItems(): string[];
}

interface CellMetadata {
    v: any; // value
    c: boolean; // computed
    r: boolean; // reliable
}

interface NestedObjectFormatter {
    fromNestedObject(value: Record<string, any>, dimensions: Dimension[]): any[];
    toNestedObject(
        values: any[],
        status: Uint8Array,
        dimensions: Dimension[],
        withMetadata?: boolean
    ): any;
}

function toNestedObjectRec(
    values: any[],
    status: Uint8Array,
    dimensions: Dimension[],
    dimOffset: number,
    offset: number,
    withMetadata: boolean
): any {
    if (dimOffset >= dimensions.length) {
        if (withMetadata) {
            const cellStatus = status[offset];
            return {
                v: values[offset],
                c: !(cellStatus & 1),
                r: !(cellStatus & 4),
            } as CellMetadata;
        } else {
            return values[offset];
        }
    }

    const result: Record<string, any> = {};
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

const nestedObjectFormatter: NestedObjectFormatter = {
    fromNestedObject(value: Record<string, any>, dimensions: Dimension[]): any[] {
        let valueArray: any[] = [value];

        for (let i = 0; i < dimensions.length; ++i) {
            const dimItems = dimensions[i].getItems();
            const newValue = new Array(valueArray.length * dimensions[i].numItems);

            for (let j = 0; j < newValue.length; ++j) {
                const chunkIndex = Math.floor(j / dimItems.length);
                const dimItem = dimItems[j % dimItems.length];

                newValue[j] = valueArray[chunkIndex][dimItem];
            }

            valueArray = newValue;
        }

        return valueArray;
    },

    toNestedObject(
        values: any[],
        status: Uint8Array,
        dimensions: Dimension[],
        withMetadata: boolean = false
    ): any {
        return toNestedObjectRec(values, status, dimensions, 0, 0, withMetadata);
    },
};

export = nestedObjectFormatter;

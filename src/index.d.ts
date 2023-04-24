declare module '@growblocks/olap-in-memory' {
    type NestedNumberObject = {
        [key: string]: number | NestedNumberObject;
    };

    type NestedNumberArray = number[] | NestedNumberArray[];

    export class TimeDimension {
        id: string;
        constructor(name: string, granularity: string, start: string, end: string);
        getItems(attribute: string | null): string[];
        union(other: TimeDimension): TimeDimension;
    }
    export class GenericDimension {
        id: string;
        constructor(name: string, attributes: string | string[], values: string[]);
        getItems(attribute: string | null): string[];
        renameItem(item: string, newName: string, newLabel?: string): void;
        union(other: GenericDimension): GenericDimension;
    }
    export class Cube {
        addDimension(
            dimension: GenericDimension | TimeDimension,
            aggregation?: Record<string, Record<string, string>>,
            index?: number,
            distributionObj?: Record<string, number[]>
        ): Cube;
        compose(cube: Cube, union: boolean): Cube;
        computedMeasureIds: string[];
        constructor(dimensions: (TimeDimension | GenericDimension)[]);
        convertToStoredMeasure(
            measureId: string,
            opts?: Record<string, string>,
            measureType?: string,
            defaultValue?: number
        ): void;
        copyToStoredMeasure(
            computedMeasureId: string,
            storedMeasureId: string,
            opts?: Record<string, string>,
            measureType?: string,
            defaultValue?: number
        ): void;
        createComputedMeasure(name: string, valueStr: string): void;
        createStoredMeasure(
            name: string,
            opts?: Record<string, string>,
            measureType?: string,
            defaultValue?: number
        ): void;
        clone(): Cube;
        cloneStoredMeasure(originCube: Cube, measureId: string): void;
        computedMeasures: Object;
        static deserialize(buffer: ArrayBuffer): Cube;
        dice(dimensionId: string, attribute: string, value: string[]): Cube;
        diceRange(dimensionId: string, attribute: string, start: string, end: string): Cube;
        dimensionIds: string[];
        drillDown(dimensionId: string, attribute: string, distributions?: number[]): Cube;
        drillUp(dimensionId: string, attribute: string, values?: string[]): Cube;
        dropMeasure(measure: string): void;
        getData(measure: string): number[];
        getDimension(dimensionId: string): GenericDimension | TimeDimension;
        getNestedArray(measure: string): NestedNumberArray;
        getNestedObject(measure: string): NestedNumberObject;
        hydrateFromCube(cube: Cube): void;
        hydrateFromSparseNestedObject(measure: string, data: NestedNumberObject): void;
        keepDimensions(dimensionIds: string[]): Cube;
        removeDimension(dimensionId: string): Cube;
        removeDimensions(dimensionIds: string[]): Cube;
        renameMeasure(oldName: string, newName: string): Cube;
        reorderDimensions(dimensionIds: string[]): Cube;
        serialize(): ArrayBuffer;
        setData(measure: string, data: number[]): void;
        setNestedArray(measure: string, data: NestedNumberArray): void;
        setNestedObject(measure: string, obj: NestedNumberObject): void;
        setSingleData(measure: string, coords: Record<string, string>, value: number): void;
        slice(dimensionId: string, attribute: string, value: string): Cube;
        storeSize: number;
        storedMeasureIds: string[];
        swapDimensions(dim1: string, dim2: string): Cube;
    }
}

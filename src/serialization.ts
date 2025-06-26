type TypedArrayConstructor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor
    | BigInt64ArrayConstructor
    | BigUint64ArrayConstructor;

type TypedArrayInstance =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

type ArrayBufferView =
    | DataView
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

type SerializableValue =
    | null
    | ArrayBuffer
    | TypedArrayInstance
    | unknown[]
    | string
    | number
    | boolean
    | Record<string, unknown>;

const TypedArraySubClasses: TypedArrayConstructor[] = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
];

const ARRAY_BUFFER = 1;
const TYPED_ARRAY = 2;
const ARRAY = 3;
const STRING = 4;
const OBJECT = 5;
const NULL = 6;
const NUMBER = 7;
const BOOLEAN = 8;
const TYPED_ARRAY_ARRAY = 9;

/**
 * Serialize a mix of ArrayBuffer, TypedArray, Array, String and plain objects into a buffer.
 */
function toBuffer(obj: SerializableValue): ArrayBuffer {
    let result: ArrayBuffer;

    if (obj === null) {
        result = new ArrayBuffer(4);
        new Uint32Array(result, 0, 1).set([NULL]);
    } else if (typeof obj === 'boolean') {
        result = new ArrayBuffer(8);
        new Uint32Array(result, 0, 1).set([BOOLEAN]);
        new Uint32Array(result, 4, 1).set([obj ? 1 : 0]);
    } else if (ArrayBuffer.isView(obj)) {
        // Handle all TypedArrays and DataView
        if (obj instanceof DataView) {
            throw new Error('DataView is not supported for serialization');
        }
        const typeIndex = TypedArraySubClasses.findIndex(type => obj instanceof type);
        if (typeIndex === -1) {
            throw new Error('Unknown TypedArray type for serialization');
        }
        const payload = toBuffer(obj.buffer);
        const byteOffset = obj.byteOffset;
        const length = obj.length;

        result = new ArrayBuffer(16 + payload.byteLength);
        new Uint32Array(result, 0, 4).set([TYPED_ARRAY, typeIndex, byteOffset, length]);
        new Uint8Array(result, 16, payload.byteLength).set(new Uint8Array(payload));
    } else if (obj instanceof ArrayBuffer) {
        // We waste some space by padding the end of each arraybuffer with zeros
        // to avoid breaking alignment in the blob.
        result = new ArrayBuffer(8 + Math.ceil(obj.byteLength / 4) * 4);
        new Uint32Array(result, 0, 2).set([ARRAY_BUFFER, obj.byteLength]);
        new Uint8Array(result, 8, obj.byteLength).set(new Uint8Array(obj));
    } else if (
        obj &&
        typeof obj === 'object' &&
        'buffer' in obj &&
        obj.buffer instanceof ArrayBuffer
    ) {
        const typeIndex = TypedArraySubClasses.findIndex(type => obj instanceof type);
        const payload = toBuffer(obj.buffer);

        result = new ArrayBuffer(8 + payload.byteLength);
        new Uint32Array(result, 0, 2).set([TYPED_ARRAY, typeIndex]);
        new Uint8Array(result, 8, payload.byteLength).set(new Uint8Array(payload));
    } else if (Array.isArray(obj)) {
        // Check if all elements are TypedArrays
        const allTypedArrays = (obj as unknown[]).every(
            x => ArrayBuffer.isView(x) && !(x instanceof DataView)
        );

        if (allTypedArrays) {
            // Array of TypedArrays - serialize each as TYPED_ARRAY
            const buffers = (obj as TypedArrayInstance[]).map(item => toBuffer(item));
            const payloadLength = buffers.reduce((m, b) => m + 4 + b.byteLength, 0);

            result = new ArrayBuffer(8 + payloadLength);
            new Uint32Array(result, 0, 2).set([TYPED_ARRAY_ARRAY, buffers.length]);

            let offset = 8;
            for (let i = 0; i < buffers.length; ++i) {
                new Uint32Array(result, offset, 1).set([buffers[i].byteLength]);
                new Uint8Array(result, offset + 4, buffers[i].byteLength).set(
                    new Uint8Array(buffers[i])
                );
                offset += 4 + buffers[i].byteLength;
            }
        } else {
            // Regular array - serialize as before
            const buffers = (obj as SerializableValue[]).map(item => toBuffer(item));
            const payloadLength = buffers.reduce((m, b) => m + 4 + b.byteLength, 0);

            result = new ArrayBuffer(8 + payloadLength);
            new Uint32Array(result, 0, 2).set([ARRAY, buffers.length]);

            let offset = 8;
            for (let i = 0; i < buffers.length; ++i) {
                new Uint32Array(result, offset, 1).set([buffers[i].byteLength]);
                new Uint8Array(result, offset + 4, buffers[i].byteLength).set(
                    new Uint8Array(buffers[i])
                );
                offset += 4 + buffers[i].byteLength;
            }
        }
    } else if (typeof obj === 'string') {
        const payload = toBuffer(new TextEncoder().encode(obj));

        result = new ArrayBuffer(4 + payload.byteLength);
        new Uint32Array(result, 0, 1).set([STRING]);
        new Uint8Array(result, 4, payload.byteLength).set(new Uint8Array(payload));
    } else if (typeof obj === 'number') {
        result = new ArrayBuffer(8);
        new Uint32Array(result, 0, 1).set([NUMBER]);
        new Float32Array(result, 4, 1).set([obj]);
    } else if (
        typeof obj === 'object' &&
        obj !== null &&
        !Array.isArray(obj) &&
        !(obj instanceof ArrayBuffer) &&
        !('buffer' in obj)
    ) {
        // Object case
        const entries = Object.entries(obj as Record<string, SerializableValue>).filter(
            ([, value]) => typeof value !== 'function'
        );
        const payload = toBuffer(
            entries.map(([key, value]) => [key, toBuffer(value)]) as [string, ArrayBuffer][]
        );

        result = new ArrayBuffer(4 + payload.byteLength);
        new Uint32Array(result, 0, 1).set([OBJECT]);
        new Uint8Array(result, 4, payload.byteLength).set(new Uint8Array(payload));
    } else {
        // This should never happen with valid data
        throw new Error(`Unknown type for serialization: ${typeof obj}`);
    }

    return result;
}

function fromBuffer(buffer: ArrayBuffer, offset: number = 0): SerializableValue {
    const header = new Uint32Array(buffer, offset, 1)[0];

    if (header === ARRAY_BUFFER) {
        const size = new Uint32Array(buffer, offset + 4, 1)[0];
        return buffer.slice(offset + 8, offset + 8 + size);
    } else if (header === TYPED_ARRAY) {
        const typeIndex = new Uint32Array(buffer, offset + 4, 1)[0];
        const byteOffset = new Uint32Array(buffer, offset + 8, 1)[0];
        const length = new Uint32Array(buffer, offset + 12, 1)[0];
        const payload = fromBuffer(buffer, offset + 16) as ArrayBuffer;
        return new (TypedArraySubClasses[typeIndex] as any)(payload, byteOffset, length);
    } else if (header === ARRAY) {
        const size = new Uint32Array(buffer, offset + 4, 1)[0];
        const result: unknown[] = [];

        let itemOffset = offset + 8;
        for (let i = 0; i < size; ++i) {
            const itemSize = new Uint32Array(buffer, itemOffset, 1)[0];
            const item = fromBuffer(buffer, itemOffset + 4);

            result.push(item);
            itemOffset += 4 + itemSize;
        }

        // If all elements are numbers, return as number[]
        if (result.every(x => typeof x === 'number')) {
            return result as number[];
        }
        // If all elements are Uint8Array, return as Uint8Array[]
        if (result.every(x => ArrayBuffer.isView(x) && x instanceof Uint8Array)) {
            return result as Uint8Array[];
        }
        // If any element is a TypedArray, return as-is (array of TypedArrays)
        if (result.some(x => ArrayBuffer.isView(x))) {
            return result;
        }

        return result;
    } else if (header === STRING) {
        const payload = fromBuffer(buffer, offset + 4) as ArrayBuffer;
        return new TextDecoder().decode(payload);
    } else if (header === NULL) {
        return null;
    } else if (header === NUMBER) {
        return new Float32Array(buffer, offset + 4, 1)[0];
    } else if (header === OBJECT) {
        const result: Record<string, unknown> = {};
        const entries = fromBuffer(buffer, offset + 4) as [string, ArrayBuffer][];
        entries.forEach(entry => {
            result[entry[0]] = fromBuffer(entry[1]) as SerializableValue;
        });
        return result;
    } else if (header === BOOLEAN) {
        return new Uint32Array(buffer, offset + 4, 1)[0] === 1;
    } else if (header === TYPED_ARRAY_ARRAY) {
        const size = new Uint32Array(buffer, offset + 4, 1)[0];
        const result: TypedArrayInstance[] = [];

        let itemOffset = offset + 8;
        for (let i = 0; i < size; ++i) {
            const itemSize = new Uint32Array(buffer, itemOffset, 1)[0];
            const item = fromBuffer(buffer, itemOffset + 4) as TypedArrayInstance;

            result.push(item);
            itemOffset += 4 + itemSize;
        }

        return result;
    }

    // This should never happen with valid data
    throw new Error(`Unknown header value: ${header}`);
}

export { toBuffer, fromBuffer, SerializableValue, TypedArrayInstance };

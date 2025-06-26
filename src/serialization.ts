import { Packr } from 'msgpackr';

const packr = new Packr({ structuredClone: true });

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

type SerializableValue =
    | null
    | Buffer
    | TypedArrayInstance
    | unknown[]
    | string
    | number
    | boolean
    | Record<string, unknown>;

/**
 * Serialize a value to an Buffer using msgpackr with structuredClone enabled
 */
function toBuffer(obj: SerializableValue): Buffer {
    return packr.pack(obj);
}

/**
 * Deserialize a value from an Buffer using msgpackr with structuredClone enabled
 */
function fromBuffer(buffer: Buffer): SerializableValue {
    return packr.unpack(buffer) as SerializableValue;
}

export { toBuffer, fromBuffer, SerializableValue, TypedArrayInstance };

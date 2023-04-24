const TypedArraySubClasses = [
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

/**
 * Serialize a mix of ArrayBuffer, TypedArray, Array, String and plain objects into a buffer.
 */
function toBuffer(obj) {
    let result;

    if (obj === null) {
        result = new ArrayBuffer(4);
        new Uint32Array(result, 0, 1).set([NULL]);
    } else if (obj === undefined) {
        result = new ArrayBuffer(4);
        new Uint32Array(result, 0, 1).set([undefined]);
    } else if (obj instanceof ArrayBuffer) {
        // We waste some space by padding the end of each arraybuffer with zeros
        // to avoid breaking alignment in the blob.
        result = new ArrayBuffer(8 + Math.ceil(obj.byteLength / 4) * 4);
        new Uint32Array(result, 0, 2).set([ARRAY_BUFFER, obj.byteLength]);
        new Uint8Array(result, 8, obj.byteLength).set(new Uint8Array(obj));
    } else if (obj.buffer instanceof ArrayBuffer) {
        const typeIndex = TypedArraySubClasses.findIndex(type => obj instanceof type);
        const payload = toBuffer(obj.buffer);

        result = new ArrayBuffer(8 + payload.byteLength);
        new Uint32Array(result, 0, 2).set([TYPED_ARRAY, typeIndex]);
        new Uint8Array(result, 8, payload.byteLength).set(new Uint8Array(payload));
    } else if (Array.isArray(obj)) {
        const buffers = obj.map(item => toBuffer(item));
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
    } else if (typeof obj === 'string') {
        const payload = toBuffer(new TextEncoder().encode(obj));

        result = new ArrayBuffer(4 + payload.byteLength);
        new Uint32Array(result, 0, 1).set([STRING]);
        new Uint8Array(result, 4, payload.byteLength).set(new Uint8Array(payload));
    } else if (typeof obj === 'number') {
        result = new ArrayBuffer(8);
        new Uint32Array(result, 0, 1).set([NUMBER]);
        new Float32Array(result, 4, 1).set([obj]);
    } else {
        const payload = toBuffer(Object.entries(obj).map(([key, value]) => [key, toBuffer(value)]));

        result = new ArrayBuffer(4 + payload.byteLength);
        new Uint32Array(result, 0, 1).set([5]);
        new Uint8Array(result, 4, payload.byteLength).set(new Uint8Array(payload));
    }

    return result;
}

function fromBuffer(buffer, offset = 0) {
    const header = new Uint32Array(buffer, offset, 1)[0];

    if (header === ARRAY_BUFFER) {
        const size = new Uint32Array(buffer, offset + 4, 1)[0];
        return buffer.slice(offset + 8, offset + 8 + size);
    } else if (header === TYPED_ARRAY) {
        const typeIndex = new Uint32Array(buffer, offset + 4, 1)[0];
        const payload = fromBuffer(buffer, offset + 8);
        return new TypedArraySubClasses[typeIndex](payload);
    } else if (header === ARRAY) {
        const size = new Uint32Array(buffer, offset + 4, 1)[0];
        const result = [];

        let itemOffset = offset + 8;
        for (let i = 0; i < size; ++i) {
            const itemSize = new Uint32Array(buffer, itemOffset, 1)[0];
            const item = fromBuffer(buffer, itemOffset + 4);

            result.push(item);
            itemOffset += 4 + itemSize;
        }

        return result;
    } else if (header === STRING) {
        const payload = fromBuffer(buffer, offset + 4);
        return new TextDecoder().decode(payload);
    } else if (header === NULL) {
        return null;
    } else if (header === NUMBER) {
        return new Float32Array(buffer, offset + 4, 1)[0];
    } else if (header === OBJECT) {
        const result = {};
        fromBuffer(buffer, offset + 4).forEach(entry => {
            result[entry[0]] = fromBuffer(entry[1]);
        });
        return result;
    }
}

function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

module.exports = { toBuffer, fromBuffer, toArrayBuffer };

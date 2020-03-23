const assert = require('chai').assert;
const { toBuffer, fromBuffer } = require('../src/serialization');

describe('serialization', function () {

    it('should be able to pickle and unpickle primitive types', function () {
        const obj = [
            new Int32Array([255]),
            'totot',
            new Float32Array([666]),
            {
                'toto': {
                    'tata': new Float32Array([666]),
                }
            },
            null
        ];

        const payload = toBuffer(obj);
        const newObj = fromBuffer(payload)

        assert.deepEqual(obj, newObj);
    });

});
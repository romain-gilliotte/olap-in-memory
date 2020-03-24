const assert = require('chai').assert;
const { Cube, GenericDimension, TimeDimension } = require('../src');
const { toBuffer, fromBuffer } = require('../src/serialization');

describe('Serialization', function () {

	describe('generic serialization', function () {

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

	describe("cube serialization", function () {

		let cube;

		before(function () {
			const items = [];
			for (let i = 0; i < 50; ++i)
				items.push(i.toString());

			cube = new Cube([
				new GenericDimension('dim1', 'root', items),
				new GenericDimension('dim2', 'root', items),
				new TimeDimension('time', 'month', '2010-01', '2011-01')
			]);

			cube.createStoredMeasure('main', {}, 33);
		});

		it("should get the same cube after a serialization/deserialization round", function () {
			const buffer = cube.serialize();
			const newCube = Cube.deserialize(buffer);

			assert.deepEqual(
				cube.getNestedObject('main'),
				newCube.getNestedObject('main')
			);
		});

	});

});

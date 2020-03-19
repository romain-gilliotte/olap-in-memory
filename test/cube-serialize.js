const assert = require('chai').assert;
const { Cube, GenericDimension, TimeDimension } = require('../src');

describe("cube serialize", function () {

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

	it("serialization", function () {
		const buffer = cube.serialize();
		const newCube = Cube.deserialize(buffer);

		assert.deepEqual(
			cube.getNestedObject('main'),
			newCube.getNestedObject('main')
		);
	});

});

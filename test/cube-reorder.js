const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');

describe("Reordering dimensions and items", function () {

	let cube;

	beforeEach(function () {
		cube = createTestCube(true, true);
	});

	describe("reorderDimensions", function () {

		it('should inverse the dimensions', function () {
			const inversed = cube.reorderDimensions(['period', 'location']);

			assert.deepEqual(inversed.getNestedArray('antennas'), [[1, 4, 16], [2, 8, 32]]);
		});

	});

	describe("dice", function () {

		it('should dice on cities reversed', function () {
			const parTolCube = cube.dice('location', 'city', ['toledo', 'paris'], true);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[4, 8], [1, 2]]);
		});

		it('should not allow reordering on continents', function () {
			assert.throws(() => cube.dice('location', 'continent', ['europe'], true));
		});

	});

});


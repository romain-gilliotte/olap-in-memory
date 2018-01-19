import chai from "chai";
const assert = chai.assert;

import createTestCube from './helpers/create-test-cube';


describe("Reordering dimensions and items", function() {

	let cube;

	beforeEach(function() {
		cube = createTestCube(true, true);
	});

	describe("reorderDimensions", function() {

		it('should inverse the dimensions', function() {
			const inversed = cube.reorderDimensions(['season', 'city']);

			assert.deepEqual(inversed.getNestedArray('antennas'), [[1, 4, 16], [2, 8, 32]]);
		});

	});

	describe("dice", function() {

		it('should dice on cities reversed', function() {
			const parTolCube = cube.dice('city', ['toledo', 'paris'], true);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[4, 8], [1, 2]]);
		});

		it('should not allow reordering on continents', function() {
			assert.throws(() => cube.dice('continent', ['europe'], true));
		});

	});

});


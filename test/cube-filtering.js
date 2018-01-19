import chai from "chai";
const assert = chai.assert;

import createTestCube from './helpers/create-test-cube';

describe("filtering cubes", function() {

	let cube;

	beforeEach(function() {
		cube = createTestCube(true, true);
	});

	describe("slice", function() {

		it('should remove cities', function() {
			const parisCube = cube.slice('city', 'paris');

			assert.deepEqual(parisCube.getNestedArray('antennas'), [1, 2]);
			assert.equal(parisCube.dimensions.length, 1);
			assert.equal(parisCube.dimensions[0].id, 'season');
		});

		it('should remove seasons', function() {
			const winterCube = cube.slice('season', 'winter');

			assert.deepEqual(winterCube.getNestedArray('antennas'), [2, 8, 32]);
			assert.equal(winterCube.dimensions.length, 1);
			assert.equal(winterCube.dimensions[0].id, 'city');
		});

		it('should remove both cities and seasons', function() {
			const tolWinCube = cube.slice('season', 'winter').slice('city', 'toledo');

			assert.deepEqual(tolWinCube.getNestedArray('antennas'), 8);
			assert.equal(tolWinCube.dimensions.length, 0);
		});

		it('should raise an error if a group is specified', function() {
			assert.throws(() => cube.slice('continent', 'europe'));
		});
	});

	describe("dice", function() {

		it('should dice on cities', function() {
			const parTolCube = cube.dice('city', ['paris', 'toledo']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on cities conserving order', function() {
			const parTolCube = cube.dice('city', ['toledo', 'paris']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on continents', function() {
			const parTolCube = cube.dice('continent', ['europe']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should filter the other dimension', function() {
			const winterCube = cube.dice('season', ['winter']);

			assert.deepEqual(winterCube.getNestedArray('antennas'), [[2], [8], [32]]);
		});

	});
});

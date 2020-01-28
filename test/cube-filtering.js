const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');

describe("filtering cubes", function () {

	let cube;

	beforeEach(function () {
		cube = createTestCube(true, true);
	});

	describe("slice", function () {

		it('should remove cities', function () {
			const parisCube = cube.slice('location', 'city', 'paris');

			assert.deepEqual(parisCube.getNestedArray('antennas'), [1, 2]);
			assert.equal(parisCube.dimensions.length, 1);
			assert.equal(parisCube.dimensions[0].id, 'period');
		});

		it('should remove seasons', function () {
			const winterCube = cube.slice('period', 'season', 'winter');

			assert.deepEqual(winterCube.getNestedArray('antennas'), [2, 8, 32]);
			assert.equal(winterCube.dimensions.length, 1);
			assert.equal(winterCube.dimensions[0].id, 'location');
		});

		it('should remove both cities and seasons', function () {
			const tolWinCube = cube.slice('period', 'season', 'winter').slice('location', 'city', 'toledo');

			assert.deepEqual(tolWinCube.getNestedArray('antennas'), 8);
			assert.equal(tolWinCube.dimensions.length, 0);
		});

	});

	describe("dice", function () {

		it('should dice on cities', function () {
			const parTolCube = cube.dice('location', 'city', ['paris', 'toledo']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on cities conserving order', function () {
			const parTolCube = cube.dice('location', 'city', ['toledo', 'paris']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on continents', function () {
			const parTolCube = cube.dice('location', 'continent', ['europe']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should filter the other dimension', function () {
			const winterCube = cube.dice('period', 'season', ['winter']);

			assert.deepEqual(winterCube.getNestedArray('antennas'), [[2], [8], [32]]);
		});

		it('should work dicing on non existent item', function () {
			assert.equal(
				cube.dice('location', 'city', ['nonexisting', 'paris']).storeSize,
				cube.storeSize / 3
			);
		});

		it('should work dicing on empty array', function () {
			assert.equal(
				cube.dice('location', 'city', []).storeSize,
				0
			);
		});

	});
});

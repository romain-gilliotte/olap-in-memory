const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');
const { Cube, Dimension } = require('../src');
// const Cube = require('../src/cube');



describe("aggregating cubes", function () {

	describe("removeDimension", function () {
		let cube;

		beforeEach(function () {
			const period = new Dimension('period', 'season', ['summer', 'winter']);
			const location = new Dimension('location', 'city', ['paris', 'toledo', 'tokyo']);

			cube = new Cube([location, period]);
			for (let agg of ['sum', 'average', 'highest', 'lowest', 'first', 'last']) {
				cube.createStoredMeasure(`antennas_${agg}`, { period: agg, location: agg }, 0);
				cube.setNestedArray(`antennas_${agg}`, [[1, 2], [4, 8], [16, 32]]);
			}

			cube = cube.removeDimension('location');
		});

		it('should sum cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_sum'), [21, 42]);
		});

		it('should average cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_average'), [21 / 3, 42 / 3]);
		});

		it('should highest cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_highest'), [16, 32]);
		});

		it('should lowest cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_lowest'), [1, 2]);
		});

		it('should first cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_first'), [1, 2]);
		});

		it('should last cities', function () {
			assert.deepEqual(cube.getNestedArray('antennas_last'), [16, 32]);
		});

	});

	describe("drillUp", function () {

		let cube;

		beforeEach(function () {
			cube = createTestCube(true, true);
		});

		it('should sum cities by continent', function () {
			const antennas2 = cube.drillUp('location', 'continent');

			assert.deepEqual(
				antennas2.getNestedArray('antennas'),
				[[5, 10], [16, 32]]
			);
		});

	});

});


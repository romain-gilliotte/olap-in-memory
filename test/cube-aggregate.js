import chai from "chai";
const assert = chai.assert;

import createTestCube from './helpers/create-test-cube';

describe("aggregating cubes", function() {

	let cube;

	beforeEach(function() {
		cube = createTestCube(true, true);
	});

	describe("removeDimension", function() {

		it('should sum cities', function() {
			const cube2 = cube.removeDimension('location');

			assert.deepEqual(cube2.getNestedArray('antennas'), [21, 42]);
		});

		it('should sum seasons', function() {
			const cube2 = cube.removeDimension('period');

			assert.deepEqual(cube2.getNestedArray('antennas'), [3, 12, 48]);
		});

		it('should average cities', function() {
			const cube2 = cube.removeDimension('location', {antennas: 'average'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [21/3, 42/3]);
		});

		it('should highest cities', function() {
			const cube2 = cube.removeDimension('location', {antennas: 'highest'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [16, 32]);
		});

		it('should lowest cities', function() {
			const cube2 = cube.removeDimension('location', {antennas: 'lowest'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [1, 2]);
		});

		it('should first cities', function() {
			const cube2 = cube.removeDimension('location', {antennas: 'first'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [1, 2]);
		});

		it('should last cities', function() {
			const cube2 = cube.removeDimension('location', {antennas: 'last'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [16, 32]);
		});

	});

	describe("drillUp", function() {

		it('should sum cities by continent', function() {
			const antennas2 = cube.drillUp('location', 'continent');

			assert.deepEqual(
				antennas2.getNestedArray('antennas'),
				[[5, 10], [16, 32]]
			);
		});

	});

});


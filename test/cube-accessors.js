import chai from "chai";
const assert = chai.assert;

import createTestCube from './helpers/create-test-cube';

describe('accessors', function() {

	describe('getting data', function() {
		let cube;

		beforeEach(function() {
			cube = createTestCube(true, true);
		});

		it('should have a storeSize of 6', function() {
			assert.equal(cube.storeSize, 6);
		});

		it('should retrieve flat array', function() {
			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should retrieve nested array', function() {
			assert.deepEqual(
				cube.getNestedArray('antennas'),
				[[1, 2], [4, 8], [16, 32]]
			);
		});

		it('should retrieve nested object', function() {
			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					paris: {summer: 1, winter: 2},
					toledo: {summer: 4, winter: 8},
					tokyo: {summer: 16, winter: 32}
				}
			);
		});

		it('should compute flat array', function() {
			assert.deepEqual(
				cube.getFlatArray('router_by_antennas'),
				[3/1, 2/2, 4/4, 9/8, 16/16, 32/32]
			);
		});
	});

	describe('setting data', function() {

		let cube;

		beforeEach(function() {
			cube = createTestCube(true, false);
		});

		it('should set flat array', function() {
			cube.setFlatArray('antennas', [1, 2, 4, 8, 16, 32]),
			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should set nested array', function() {
			cube.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);
			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should set nested object', function() {
			cube.setNestedObject('antennas', {
				paris: {summer: 1, winter: 2},
				toledo: {summer: 4, winter: 8},
				tokyo: {summer: 16, winter: 32}
			});

			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});
	});
});


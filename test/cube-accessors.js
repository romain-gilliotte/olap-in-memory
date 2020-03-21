const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');
const { Cube, GenericDimension } = require('../src');

describe('accessors', function () {

	describe('getting data', function () {
		let cube;

		beforeEach(function () {
			cube = createTestCube(true, true);
		});

		it('should have a storeSize of 6', function () {
			assert.equal(cube.storeSize, 6);
		});

		it('should have a byteLength of 48', function () {
			assert.equal(cube.byteLength, 48);
		});

		it('should retrieve flat array', function () {
			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should retrieve nested array', function () {
			assert.deepEqual(
				cube.getNestedArray('antennas'),
				[[1, 2], [4, 8], [16, 32]]
			);
		});

		it('should retrieve nested object', function () {
			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					paris: { summer: 1, winter: 2 },
					toledo: { summer: 4, winter: 8 },
					tokyo: { summer: 16, winter: 32 }
				}
			);
		});

		it('should compute flat array', function () {
			assert.deepEqual(
				cube.getFlatArray('router_by_antennas'),
				[3 / 1, 2 / 2, 4 / 4, 9 / 8, 16 / 16, 32 / 32]
			);
		});
	});

	describe('setting data', function () {

		let cube;

		beforeEach(function () {
			cube = createTestCube(true, false);
		});

		it('should set flat array', function () {
			cube.setFlatArray('antennas', [1, 2, 4, 8, 16, 32]),
				assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should set nested array', function () {
			cube.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);
			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

		it('should set nested object', function () {
			cube.setNestedObject('antennas', {
				paris: { summer: 1, winter: 2 },
				toledo: { summer: 4, winter: 8 },
				tokyo: { summer: 16, winter: 32 }
			});

			assert.deepEqual(cube.getFlatArray('antennas'), [1, 2, 4, 8, 16, 32]);
		});

	});

	describe('fillFrom', function () {

		it('it should fill from another cube', function () {
			const period1 = new GenericDimension('period', 'season', ['summer', 'winter']);
			const location1 = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);
			const cube1 = new Cube([location1, period1]);
			cube1.createStoredMeasure('antennas', {}, 0);

			const period2 = new GenericDimension('period', 'season', ['winter']);
			const location2 = new GenericDimension('location', 'city', ['paris', 'tokyo']);
			const cube2 = new Cube([location2, period2]);
			cube2.createStoredMeasure('antennas', {}, 0);
			cube2.setFlatArray('antennas', [32, 53]);

			cube1.hydrateFromCube(cube2);

			assert.deepEqual(cube1.getNestedArray('antennas'), [[0, 32], [0, 0], [0, 53]]);
		});

		it('should also work with more complicated situation', function () {

		})

	});
});


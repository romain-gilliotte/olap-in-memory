const assert = require('chai').assert;
const { Cube, GenericDimension } = require('../src');

describe('compose', function () {

	it('should compose simple cubes', function () {
		const period = new GenericDimension('period', 'season', ['summer', 'winter']);
		const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

		const cube1 = new Cube([location, period]);
		cube1.createStoredMeasure('antennas', {}, 0);
		cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

		const cube2 = new Cube([location, period]);
		cube2.createStoredMeasure('routers', {}, 0);
		cube2.setNestedArray('routers', [[3, 2], [4, 9], [16, 32]]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['location', 'period']);
		assert.deepEqual(newCube.getNestedArray('routers'), [[3, 2], [4, 9], [16, 32]]);
		assert.deepEqual(newCube.getNestedArray('antennas'), [[1, 2], [4, 8], [16, 32]]);
	});

	it('should also work when one cube is missing a dimension', function () {
		const period = new GenericDimension('period', 'season', ['summer', 'winter']);
		const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

		const cube1 = new Cube([location, period]);
		cube1.createStoredMeasure('antennas', {}, 0);
		cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

		const cube2 = new Cube([location]);
		cube2.createStoredMeasure('routers', {}, 0);
		cube2.setNestedArray('routers', [3, 4, 16]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['location']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [3, 12, 48]);
		assert.deepEqual(newCube.getNestedArray('routers'), [3, 4, 16]);

	})

});



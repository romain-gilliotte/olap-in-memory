const assert = require('chai').assert;
const { Cube, GenericDimension, TimeDimension } = require('../src');

describe('compose', function () {

	it('should compose cubes with the exact same dimensions', function () {
		const period = new GenericDimension('period', 'season', ['summer', 'winter']);
		const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

		const cube1 = new Cube([location, period]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

		const cube2 = new Cube([location, period]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [[3, 2], [4, 9], [16, 32]]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['location', 'period']);
		assert.deepEqual(newCube.getNestedArray('routers'), [[3, 2], [4, 9], [16, 32]]);
		assert.deepEqual(newCube.getNestedArray('antennas'), [[1, 2], [4, 8], [16, 32]]);
	});

	it('should compose cubes if a dimension is missing from one of the cubes', function () {
		const period = new GenericDimension('period', 'season', ['summer', 'winter']);
		const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

		const cube1 = new Cube([location, period]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

		const cube2 = new Cube([location]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [3, 4, 16]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['location']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [3, 12, 48]);
		assert.deepEqual(newCube.getNestedArray('routers'), [3, 4, 16]);
	});

	it('should compose cubes if items are missing from both cubes', function () {
		const period = new GenericDimension('period', 'season', ['summer', 'winter']);

		const location1 = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);
		const cube1 = new Cube([location1, period]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

		const location2 = new GenericDimension('location', 'city', ['soria', 'tokyo', 'paris']);
		const cube2 = new Cube([location2, period]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [[64, 128], [256, 512], [1024, 2048]]);


		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['location', 'period']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [[1, 2], [16, 32]]);
		assert.deepEqual(newCube.getNestedArray('routers'), [[1024, 2048], [256, 512]]);
	});

	it('should compose cubes with the same time dimension', function () {
		const time = new TimeDimension('time', 'month', '2010-01', '2010-02');
		const cube1 = new Cube([time]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [1, 2]);

		const cube2 = new Cube([time]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [3, 2]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['time']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [1, 2]);
		assert.deepEqual(newCube.getNestedArray('routers'), [3, 2]);
	});

	it('should compose cubes with overlapping time dimension', function () {
		const time1 = new TimeDimension('time', 'month', '2010-01', '2010-02');
		const cube1 = new Cube([time1]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [1, 2]);

		const time2 = new TimeDimension('time', 'month', '2010-02', '2010-03');
		const cube2 = new Cube([time2]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [3, 2]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['time']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [2]);
		assert.deepEqual(newCube.getNestedArray('routers'), [3]);
	});

	it('should raise if composing cubes with no overlap in time dimension', function () {
		const time1 = new TimeDimension('time', 'month', '2010-01', '2010-02');
		const cube1 = new Cube([time1]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [1, 2]);

		const time2 = new TimeDimension('time', 'month', '2010-03', '2010-04');
		const cube2 = new Cube([time2]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [3, 2]);

		assert.throws(() => cube1.compose(cube2));
	});

	it('should compose cubes with overlapping time dimension w/ different root attributes', function () {
		const time1 = new TimeDimension('time', 'month', '2010-01', '2010-04');
		const cube1 = new Cube([time1]);
		cube1.createStoredMeasure('antennas');
		cube1.setNestedArray('antennas', [1, 2, 4, 8]);

		const time2 = new TimeDimension('time', 'quarter', '2010-Q1', '2010-Q3');
		const cube2 = new Cube([time2]);
		cube2.createStoredMeasure('routers');
		cube2.setNestedArray('routers', [16, 32, 64]);

		const newCube = cube1.compose(cube2);
		assert.deepEqual(newCube.dimensionIds, ['time']);
		assert.deepEqual(newCube.getNestedArray('antennas'), [7, 8]);
		assert.deepEqual(newCube.getNestedArray('routers'), [16, 32]);
	});

});

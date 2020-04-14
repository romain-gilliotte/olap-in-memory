const assert = require('chai').assert;
const { Cube, GenericDimension, TimeDimension } = require('../src');

describe("Operation between cubes", function () {

	describe('compose - intersection', function () {

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

		it('should return null cube if composing cubes with no overlap in time dimension', function () {
			const time1 = new TimeDimension('time', 'month', '2010-01', '2010-02');
			const cube1 = new Cube([time1]);
			cube1.createStoredMeasure('antennas');
			cube1.setNestedArray('antennas', [1, 2]);

			const time2 = new TimeDimension('time', 'month', '2010-03', '2010-04');
			const cube2 = new Cube([time2]);
			cube2.createStoredMeasure('routers');
			cube2.setNestedArray('routers', [3, 2]);

			const newCube = cube1.compose(cube2);
			assert.equal(newCube.storeSize, 0);
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

	describe('compose - union', function () {

		it('should compose cubes with the exact same dimensions', function () {
			const period = new GenericDimension('period', 'season', ['summer', 'winter']);
			const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

			const cube1 = new Cube([location, period]);
			cube1.createStoredMeasure('antennas');
			cube1.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

			const cube2 = new Cube([location, period]);
			cube2.createStoredMeasure('routers');
			cube2.setNestedArray('routers', [[3, 2], [4, 9], [16, 32]]);

			const newCube = cube1.compose(cube2, true);
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

			const newCube = cube1.compose(cube2, true);
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

			const newCube = cube1.compose(cube2, true);
			assert.deepEqual(newCube.dimensionIds, ['location', 'period']);
			assert.deepEqual(newCube.getNestedArray('antennas'), [[1, 2], [4, 8], [16, 32], [NaN, NaN]]);
			assert.deepEqual(newCube.getNestedArray('routers'), [[1024, 2048], [NaN, NaN], [256, 512], [64, 128]]);
		});

		it('should compose cubes with the same time dimension', function () {
			const time = new TimeDimension('time', 'month', '2010-01', '2010-02');
			const cube1 = new Cube([time]);
			cube1.createStoredMeasure('antennas');
			cube1.setNestedArray('antennas', [1, 2]);

			const cube2 = new Cube([time]);
			cube2.createStoredMeasure('routers');
			cube2.setNestedArray('routers', [3, 2]);

			const newCube = cube1.compose(cube2, true);
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

			const newCube = cube1.compose(cube2, true);
			assert.deepEqual(newCube.dimensionIds, ['time']);
			assert.deepEqual(newCube.getData('antennas'), [1, 2, NaN]);
			assert.deepEqual(newCube.getData('routers'), [NaN, 3, 2]);
		});

		it('should work if composing cubes with no overlap in time dimension', function () {
			const time1 = new TimeDimension('time', 'month', '2010-01', '2010-02');
			const cube1 = new Cube([time1]);
			cube1.createStoredMeasure('antennas');
			cube1.setNestedArray('antennas', [1, 2]);

			const time2 = new TimeDimension('time', 'month', '2010-03', '2010-04');
			const cube2 = new Cube([time2]);
			cube2.createStoredMeasure('routers');
			cube2.setNestedArray('routers', [3, 2]);

			const newCube = cube1.compose(cube2, true);
			newCube.createComputedMeasure('safe_sum', 'antennas + routers');
			newCube.createComputedMeasure('unsafe_sum', 'antennas || routers');

			assert.deepEqual(newCube.dimensionIds, ['time']);
			assert.deepEqual(newCube.getData('antennas'), [1, 2, NaN, NaN]);
			assert.deepEqual(newCube.getData('routers'), [NaN, NaN, 3, 2]);
			assert.deepEqual(newCube.getData('safe_sum'), [NaN, NaN, NaN, NaN]);
			assert.deepEqual(newCube.getData('unsafe_sum'), [1, 2, 3, 2]);
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

			const newCube = cube1.compose(cube2, true);
			assert.deepEqual(newCube.dimensionIds, ['time']);
			assert.deepEqual(newCube.getData('antennas'), [7, 8, NaN]);
			assert.deepEqual(newCube.getData('routers'), [16, 32, 64]);
		});

	});

	describe('hydrateFromCube', function () {

		it('should work if the small cube does not have the required measure', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
				new GenericDimension('location', 'city', ['paris', 'tokyo'])
			]);
			cube2.createStoredMeasure('otherMeasure', {}, 'float32', 666);
			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 0, toledo: 0, tokyo: 0 }
				}
			);
		});

		it('should work if the small cube have extra measures', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
				new GenericDimension('location', 'city', ['paris', 'tokyo'])
			]);
			cube2.createStoredMeasure('antennas', {}, 'float32', 666);
			cube2.createStoredMeasure('otherMeasure', {}, 'float32', 888);

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 666, toledo: 0, tokyo: 666 }
				}
			);
		});

		it('it should work when data is missing in the small cube (no data for toledo)', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
				new GenericDimension('location', 'city', ['paris', 'tokyo'])
			]);
			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', { winter: { paris: 32, tokyo: 53 } });

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 32, toledo: 0, tokyo: 53 }
				}
			);
		});

		it('should work when data from the small cube does not fit (extra location los angeles)', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
				new GenericDimension('location', 'city', ['tokyo', 'losangeles', 'paris'])
			]);

			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', { winter: { tokyo: 1, losangeles: 2, paris: 3 } });

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 3, toledo: 0, tokyo: 1 }
				}
			);
		});

		it('should work when there is one extra dimension in the small cube', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
				new GenericDimension('something', 'root', ['a', 'b', 'c']),
				new GenericDimension('location', 'city', ['paris', 'tokyo'])
			]);

			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', {
				winter: {
					a: { paris: 1, tokyo: 2 },
					b: { paris: 3, tokyo: 4 },
					c: { paris: 5, tokyo: 6 }
				}
			});

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 9, toledo: 0, tokyo: 12 }
				}
			);
		});

		it('should work when a dimension is missing in the small cube (no location)', function () {
			const cube = new Cube([
				new GenericDimension('period', 'season', ['summer', 'winter']),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new GenericDimension('period', 'season', ['winter']),
			]);

			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', { winter: 32 });

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					summer: { paris: 0, toledo: 0, tokyo: 0 },
					winter: { paris: 11, toledo: 10, tokyo: 11 }
				}
			);
		});

		it('should work when drilling up is necessary (fill quarters from months)', function () {
			const cube = new Cube([
				new TimeDimension('time', 'quarter', '2010-Q1', '2010-Q3'),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);

			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new TimeDimension('time', 'month', '2010-04', '2010-06'),
				new GenericDimension('location', 'city', ['toledo'])
			])
			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', {
				'2010-04': { toledo: 1 },
				'2010-05': { toledo: 2 },
				'2010-06': { toledo: 3 }
			})

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					'2010-Q1': { paris: 0, toledo: 0, tokyo: 0 },
					'2010-Q2': { paris: 0, toledo: 6, tokyo: 0 },
					'2010-Q3': { paris: 0, toledo: 0, tokyo: 0 }
				}
			);
		});

		it('should work when drilling down is necessary (fill months from quarters)', function () {
			const cube = new Cube([
				new TimeDimension('time', 'month', '2010-01', '2010-06'),
				new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo'])
			]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([
				new TimeDimension('time', 'quarter', '2010-Q2', '2010-Q2'),
				new GenericDimension('location', 'city', ['toledo'])
			])
			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', { '2010-Q2': { toledo: 100 } });

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					'2010-01': { paris: 0, toledo: 0, tokyo: 0 },
					'2010-02': { paris: 0, toledo: 0, tokyo: 0 },
					'2010-03': { paris: 0, toledo: 0, tokyo: 0 },
					'2010-04': { paris: 0, toledo: 34, tokyo: 0 },
					'2010-05': { paris: 0, toledo: 33, tokyo: 0 },
					'2010-06': { paris: 0, toledo: 33, tokyo: 0 }
				}
			);
		});

		it('should allow forcing the data to fit', function () {
			const cube = new Cube([new TimeDimension('time', 'month', '2010-02', '2010-06')]);
			cube.createStoredMeasure('antennas', {}, 'float32', 0);

			const cube2 = new Cube([new TimeDimension('time', 'year', '2010', '2011')]);
			cube2.createStoredMeasure('antennas', {}, 'float32', 0);
			cube2.setNestedObject('antennas', { '2010': 1000, '2011': 500 });

			cube.hydrateFromCube(cube2);

			assert.deepEqual(
				cube.getNestedObject('antennas'),
				{
					'2010-02': 200,
					'2010-03': 200,
					'2010-04': 200,
					'2010-05': 200,
					'2010-06': 200
				}
			);
		});
	});
});

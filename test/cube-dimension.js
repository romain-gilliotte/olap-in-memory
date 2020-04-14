const assert = require('chai').assert;
const createTestCube = require('./helpers/create-test-cube');
const { Cube, GenericDimension, TimeDimension } = require('../src');

describe("Dimension", function () {


	describe('addDimension', function () {

		it('should be able to add generic dimension', function () {
			const cube = new Cube([new TimeDimension('time', 'month', '2010-01', '2010-02')]);
			cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
			cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

			const newDimension = new GenericDimension('location', 'city', ['paris', 'madrid', 'berlin'])
			const newCube = cube.addDimension(newDimension, { measure1: 'sum', measure2: 'average' });

			assert.deepEqual(
				newCube.removeDimension('location').getNestedObject('measure1'),
				cube.getNestedObject('measure1')
			);

			assert.deepEqual(
				newCube.removeDimension('location').getNestedObject('measure2'),
				cube.getNestedObject('measure2')
			);
		});

		it('should be able to add a time dimension', function () {
			const cube = new Cube([new TimeDimension('time1', 'month', '2010-01', '2010-02')]);
			cube.createStoredMeasure('measure1', { time: 'sum' }, 'float32', 100);
			cube.createStoredMeasure('measure2', { time: 'average' }, 'float32', 100);

			const newDimension = new TimeDimension('time2', 'week_mon', '2010-W01-mon', '2010-W08-mon')
			const newCube = cube.addDimension(newDimension, { measure1: 'sum', measure2: 'average' });

			assert.deepEqual(
				newCube.removeDimension('time2').getNestedObject('measure1'),
				cube.getNestedObject('measure1')
			);

			assert.deepEqual(
				newCube.removeDimension('time2').getNestedObject('measure2'),
				cube.getNestedObject('measure2')
			);
		});
	})

	describe("removeDimension", function () {
		let cube;

		beforeEach(function () {
			const period = new GenericDimension('period', 'season', ['summer', 'winter']);
			const location = new GenericDimension('location', 'city', ['paris', 'toledo', 'tokyo']);

			cube = new Cube([location, period]);
			for (let agg of ['sum', 'average', 'highest', 'lowest', 'first', 'last']) {
				cube.createStoredMeasure(`antennas_${agg}`, { period: agg, location: agg }, 'float32', 0);
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


	describe("reorderDimensions", function () {
		let cube;

		beforeEach(function () {
			cube = createTestCube(true, true);
		});

		it('should inverse the dimensions', function () {
			assert.deepEqual(
				cube.reorderDimensions(['period', 'location']).getNestedArray('antennas'),
				[[1, 4, 16], [2, 8, 32]]
			);
		});

		it('should work with more dimensions', function () {
			let cube = new Cube([
				new GenericDimension('dim1', 'item', ['11', '12']),
				new GenericDimension('dim2', 'item', ['21', '22']),
				new GenericDimension('dim3', 'item', ['31', '32'])
			]);

			cube.createStoredMeasure('main');
			cube.setData('main', [1, 2, 3, 4, 5, 6, 7, 8]);

			assert.deepEqual(
				cube.reorderDimensions(['dim1', 'dim2', 'dim3']).getNestedObject('main'),
				{
					'11': { '21': { '31': 1, '32': 2 }, '22': { '31': 3, '32': 4 } },
					'12': { '21': { '31': 5, '32': 6 }, '22': { '31': 7, '32': 8 } }
				}
			);

			assert.deepEqual(
				cube.reorderDimensions(['dim1', 'dim3', 'dim2']).getNestedObject('main'),
				{
					'11': { '31': { '21': 1, '22': 3 }, '32': { '21': 2, '22': 4 } },
					'12': { '31': { '21': 5, '22': 7 }, '32': { '21': 6, '22': 8 } }
				}
			);

			assert.deepEqual(
				cube.reorderDimensions(['dim3', 'dim2', 'dim1']).getNestedObject('main'),
				{
					'31': { '21': { '11': 1, '12': 5 }, '22': { '11': 3, '12': 7 } },
					'32': { '21': { '11': 2, '12': 6 }, '22': { '11': 4, '12': 8 } }
				}
			);

			assert.deepEqual(
				cube.reorderDimensions(['dim3', 'dim1', 'dim2']).getNestedObject('main'),
				{
					'31': { '11': { '21': 1, '22': 3 }, '12': { '21': 5, '22': 7 } },
					'32': { '11': { '21': 2, '22': 4 }, '12': { '21': 6, '22': 8 } }
				}
			);
		});

	});

});

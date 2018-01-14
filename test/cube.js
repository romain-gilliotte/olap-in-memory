import chai from "chai";
const assert = chai.assert;

import Cube from '../src/cube';
import {Dimension, StaticDimensionItem} from '../src/dimension';


const cube = new Cube(
	[
		new Dimension(
			'city',
			[
				new StaticDimensionItem('paris', {'continent': 'europe', 'size': 'megalopolis'}),
				new StaticDimensionItem('toledo', {'continent': 'europe', 'size': 'town'}),
				new StaticDimensionItem('tokyo', {'continent': 'asia', 'size': 'megalopolis'})
			]
		),
		new Dimension(
			'season',
			[
				new StaticDimensionItem('summer'),
				new StaticDimensionItem('winter')
			]
		)
	]
);

// Add antennas measure
cube.createStoredMeasure('antennas', 0);
cube.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);

// Add routers measure
cube.createStoredMeasure('routers', 0);
cube.setNestedArray('routers', [[3, 2], [4, 9], [16, 32]]);

// Add computed measure
cube.createComputedMeasure('router_by_antennas', 'routers / antennas');


describe('accessors', () => {

	it('should have a storeSize of 6', () => {
		assert.equal(cube.storeSize, 6);
	});

	it('should retrieve flat array', () => {
		assert.deepEqual(
			cube.getFlatArray('antennas'),
			[1, 2, 4, 8, 16, 32]
		);
	});

	it('should retrieve nested array', () => {
		assert.deepEqual(
			cube.getNestedArray('antennas'),
			[[1, 2], [4, 8], [16, 32]]
		);
	});

	it('should retrieve nested object', () => {
		assert.deepEqual(
			cube.getNestedObject('antennas'),
			{
				paris: {summer: 1, winter: 2},
				toledo: {summer: 4, winter: 8},
				tokyo: {summer: 16, winter: 32}
			}
		);
	});

	it('should compute flat array', () => {
		assert.deepEqual(
			cube.getFlatArray('router_by_antennas'),
			[3/1, 2/2, 4/4, 9/8, 16/16, 32/32]
		);
	});

});



describe("filtering", () => {

	describe("slice", () => {

		it('should remove cities', () => {
			const parisCube = cube.slice('city', 'paris');

			assert.deepEqual(parisCube.getNestedArray('antennas'), [1, 2]);
			assert.equal(parisCube.dimensions.length, 1);
			assert.equal(parisCube.dimensions[0].id, 'season');
		});

		it('should remove seasons', () => {
			const winterCube = cube.slice('season', 'winter');

			assert.deepEqual(winterCube.getNestedArray('antennas'), [2, 8, 32]);
			assert.equal(winterCube.dimensions.length, 1);
			assert.equal(winterCube.dimensions[0].id, 'city');
		});

		it('should remove both cities and seasons', () => {
			const tolWinCube = cube.slice('season', 'winter').slice('city', 'toledo');

			assert.deepEqual(tolWinCube.getNestedArray('antennas'), 8);
			assert.equal(tolWinCube.dimensions.length, 0);
		});

		it('should raise an error if a group is specified', () => {
			assert.throws(() => cube.slice('continent', 'europe'));
		});
	});

	describe("dice", () => {

		it('should dice on cities', () => {
			const parTolCube = cube.dice('city', ['paris', 'toledo']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on cities conserving order', () => {
			const parTolCube = cube.dice('city', ['toledo', 'paris']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should dice on cities reversed', () => {
			const parTolCube = cube.dice('city', ['toledo', 'paris'], true);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[4, 8], [1, 2]]);
		});

		it('should dice on continents', () => {
			const parTolCube = cube.dice('continent', ['europe']);

			assert.deepEqual(parTolCube.getNestedArray('antennas'), [[1, 2], [4, 8]]);
		});

		it('should not allow reordering on continents', () => {
			assert.throws(() => cube.dice('continent', ['europe'], true));
		});

		it('should filter the other dimension', () => {
			const winterCube = cube.dice('season', ['winter']);

			assert.deepEqual(winterCube.getNestedArray('antennas'), [[2], [8], [32]]);
		});

	});

});

describe("aggregation", () => {

	describe("aggregate", () => {

		it('should sum cities', () => {
			const cube2 = cube.removeDimension('city');

			assert.deepEqual(cube2.getNestedArray('antennas'), [21, 42]);
		});

		it('should sum seasons', () => {
			const cube2 = cube.removeDimension('season');

			assert.deepEqual(cube2.getNestedArray('antennas'), [3, 12, 48]);
		});

		it('should average cities', () => {
			const cube2 = cube.removeDimension('city', {antennas: 'average'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [21/3, 42/3]);
		});

		it('should highest cities', () => {
			const cube2 = cube.removeDimension('city', {antennas: 'highest'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [16, 32]);
		});

		it('should lowest cities', () => {
			const cube2 = cube.removeDimension('city', {antennas: 'lowest'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [1, 2]);
		});

		it('should first cities', () => {
			const cube2 = cube.removeDimension('city', {antennas: 'first'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [1, 2]);
		});

		it('should last cities', () => {
			const cube2 = cube.removeDimension('city', {antennas: 'last'});

			assert.deepEqual(cube2.getNestedArray('antennas'), [16, 32]);
		});

	});

	describe("drillUp", () => {

		it('should sum cities', () => {
			const antennas2 = cube.aggregateGroups('continent');

			assert.deepEqual(antennas2.dimensions[0], new Dimension(
				'continent',
				[
					new StaticDimensionItem('europe', {}),
					new StaticDimensionItem('asia', {})
				]
			));

			assert.equal(antennas2.getNestedArray('antennas'), );
		});

	});

});

describe('merge', () => {

	it('should merge simple cubes', () => {


	})

});

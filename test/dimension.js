const assert = require('chai').assert;
const { GenericDimension, TimeDimension } = require('../src');

describe('GenericDimension', function () {

	let dimension;

	before(function () {
		dimension = new GenericDimension(
			'location',
			'city',
			['paris', 'toulouse', 'madrid', 'beirut']
		);

		dimension.addChildAttribute(
			'city',
			'cityNumLetters',
			city => city.length.toString(),
			'france'
		)

		dimension.addChildAttribute(
			'city',
			'country',
			{ 'madrid': 'spain', 'beirut': 'lebanon' },
			'france'
		);

		dimension.addChildAttribute(
			'country',
			'continent',
			{ 'lebanon': 'asia' },
			'europe'
		);
	})

	it('should give proper sizes', function () {
		assert.equal(dimension.numItems, 4);
	});

	it('should give proper attributes', function () {
		assert.equal(dimension.rootAttribute, 'city');
		assert.deepEqual(dimension.attributes, ['city', 'cityNumLetters', 'country', 'continent']);
	});

	it('should compute child items for all attributes', function () {
		assert.equal(dimension.getChildItem('city', 'paris'), 'paris');
		assert.equal(dimension.getChildItem('cityNumLetters', 'madrid'), '6');
		assert.equal(dimension.getChildItem('country', 'madrid'), 'spain');
		assert.equal(dimension.getChildItem('continent', 'madrid'), 'europe');
	});

	it('should drill up', function () {
		let childDim = dimension.drillUp('country');
		assert.deepEqual(childDim.attributes, ['country', 'continent']);
		assert.deepEqual(childDim.getItems(), ['france', 'spain', 'lebanon']);

		let childDim2 = dimension.drillUp('cityNumLetters');
		assert.deepEqual(childDim2.attributes, ['cityNumLetters'])
	});
});


describe('timeDimension', function () {
	let dimension;

	before(function () {
		dimension = new TimeDimension('day', '2010-01-01', '2010-02-28');
	})

	it('should give proper sizes', function () {
		assert.equal(dimension.numItems, 31 + 28);
	});

	it('should give proper attributes', function () {
		assert.equal(dimension.rootAttribute, 'day');
		assert.deepEqual(dimension.attributes, [
			'day',
			'month_week_sat',
			'month_week_sun',
			'month_week_mon',
			'week_sat',
			'week_sun',
			'week_mon',
			'month',
			'quarter',
			'semester',
			'year'
		]);
	});

	it('should compute child items for all attributes', function () {
		assert.equal(dimension.getChildItem('day', '2010-01-15'), '2010-01-15');
		assert.equal(dimension.getChildItem('month', '2010-01-15'), '2010-01');
		assert.equal(dimension.getChildItem('year', '2010-01-15'), '2010');
	});

	it('should drill up', function () {
		let childDim = dimension.drillUp('month');
		assert.deepEqual(childDim.attributes, ['month', 'quarter', 'semester', 'year']);
		assert.deepEqual(childDim.getItems(), ['2010-01', '2010-02']);
	});

});

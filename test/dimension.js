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

	it('should compute items for all attributes', function () {
		assert.deepEqual(dimension.getItems(), ['paris', 'toulouse', 'madrid', 'beirut']);
		assert.deepEqual(dimension.getItems('city'), ['paris', 'toulouse', 'madrid', 'beirut']);
		assert.deepEqual(dimension.getItems('cityNumLetters'), ['5', '8', '6']);
	});

	it('should compute child items for all attributes', function () {
		assert.equal(dimension.getChildItem('city', 'paris'), 'paris');
		assert.equal(dimension.getChildItem('cityNumLetters', 'madrid'), '6');
		assert.equal(dimension.getChildItem('country', 'madrid'), 'spain');
		assert.equal(dimension.getChildItem('continent', 'madrid'), 'europe');
	});

	it('should compute child indexes', function () {
		assert.equal(dimension.getChildIndex('country', 0), 0);
		assert.equal(dimension.getChildIndex('country', 1), 0);
		assert.equal(dimension.getChildIndex('country', 2), 1);
		assert.equal(dimension.getChildIndex('country', 3), 2);
	});

	it('should drill up', function () {
		let childDim = dimension.drillUp('country');
		assert.deepEqual(childDim.attributes, ['country', 'continent']);
		assert.deepEqual(childDim.getItems(), ['france', 'spain', 'lebanon']);

		let childDim2 = dimension.drillUp('cityNumLetters');
		assert.deepEqual(childDim2.attributes, ['cityNumLetters'])
	});

	it('should intersect to dimensions with the same rootAttribute', function () {
		const otherDimension = new GenericDimension(
			'location',
			'city',
			['toulouse', 'madrid', 'amman', 'paris']
		);

		const intersection = dimension.intersect(otherDimension);
		assert.equal(intersection.rootAttribute, 'city');
		assert.deepEqual(intersection.getItems(), ['paris', 'toulouse', 'madrid']);
	});

	it('should intersect to dimensions with different rootAttribute', function () {
		const otherDimension = new GenericDimension(
			'location',
			'country',
			['france', 'spain', 'jordan']
		);

		const intersection = dimension.intersect(otherDimension);
		assert.equal(intersection.rootAttribute, 'country');
		assert.deepEqual(intersection.getItems(), ['france', 'spain']);
	});

	it('should raise when intersecting dimensions with no common items', function () {
		const otherDimension = new GenericDimension(
			'location',
			'city',
			['lyon', 'barcelona', 'narbonne']
		);

		assert.throws(() => dimension.intersect(otherDimension));
	});

	it('should raise when intersecting dimensions with no common attribute', function () {
		const otherDimension = new GenericDimension(
			'location',
			'postalcode',
			['75018', '75019']
		);

		assert.throws(() => dimension.intersect(otherDimension));
	});

});


describe('timeDimension', function () {
	let dimension;

	before(function () {
		dimension = new TimeDimension('time', 'month', '2009-12', '2010-02');
	})

	it('should give proper sizes', function () {
		assert.equal(dimension.numItems, 3);
	});

	it('should give proper attributes', function () {
		assert.equal(dimension.rootAttribute, 'month');
		assert.deepEqual(dimension.attributes, [
			'month',
			'quarter',
			'semester',
			'year'
		]);
	});

	it('should compute items for all attributes', function () {
		assert.deepEqual(dimension.getItems(), ['2009-12', '2010-01', '2010-02']);
		assert.deepEqual(dimension.getItems('month'), ['2009-12', '2010-01', '2010-02']);
		assert.deepEqual(dimension.getItems('year'), ['2009', '2010']);
	});

	it('should compute child items for all attributes', function () {
		assert.equal(dimension.getChildItem('month', '2010-01'), '2010-01');
		assert.equal(dimension.getChildItem('year', '2010-01'), '2010');
	});

	it('should compute child indexes for all attributes', function () {
		assert.equal(dimension.getChildIndex('month', 0), 0);
		assert.equal(dimension.getChildIndex('month', 1), 1);

		assert.equal(dimension.getChildIndex('year', 0), 0);
		assert.equal(dimension.getChildIndex('year', 1), 1);
	});

	it('should drill up', function () {
		let childDim = dimension.drillUp('quarter');
		assert.deepEqual(childDim.attributes, ['quarter', 'semester', 'year']);
		assert.deepEqual(childDim.getItems(), ['2009-Q4', '2010-Q1']);
	});

	it('should drill down', function () {
		let childDim = dimension.drillDown('week_mon');
		assert.deepEqual(childDim.attributes, ['week_mon', 'month', 'quarter', 'semester', 'year']);
		assert.deepEqual(childDim.getItems(), [
			'2009-W49-mon', '2009-W50-mon', '2009-W51-mon', '2009-W52-mon', '2009-W53-mon',
			'2010-W01-mon', '2010-W02-mon', '2010-W03-mon', '2010-W04-mon',
			'2010-W05-mon', '2010-W06-mon', '2010-W07-mon', '2010-W08-mon'
		]);
	});


	it('should intersect to dimensions with the same rootAttribute', function () {
		const otherDimension = new TimeDimension('time', 'month', '2010-01', '2010-02');

		const intersection = dimension.intersect(otherDimension);
		assert.equal(intersection.rootAttribute, 'month');
		assert.deepEqual(intersection.getItems(), ['2010-01', '2010-02']);
	});

	it('should intersect to dimensions with different rootAttribute', function () {
		const otherDimension = new TimeDimension('time', 'quarter', '2010-Q1', '2010-Q2');

		const intersection = dimension.intersect(otherDimension);
		assert.equal(intersection.rootAttribute, 'quarter');
		assert.deepEqual(intersection.getItems(), ['2010-Q1']);
	});

	it('should raise when intersecting dimensions with no common items', function () {
		const otherDimension = new TimeDimension('time', 'quarter', '2010-Q3', '2010-Q4');

		assert.throws(() => dimension.intersect(otherDimension));
	});

});

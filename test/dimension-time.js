const assert = require('chai').assert;
const { TimeDimension } = require('../src');

describe('TimeDimension', function () {
	let dimension;

	before(function () {
		dimension = new TimeDimension('time', 'month', '2009-12', '2010-02');
	})

	it('should give proper sizes', function () {
		assert.equal(dimension.numItems, 3);
	});

	it('should give proper attributes', function () {
		assert.equal(dimension.rootAttribute, 'month');
		assert.sameMembers(dimension.attributes, [
			'month',
			'quarter',
			'semester',
			'year',
			'all'
		]);
	});

	it('should compute items for all attributes', function () {
		assert.deepEqual(dimension.getItems(), ['2009-12', '2010-01', '2010-02']);
		assert.deepEqual(dimension.getItems('month'), ['2009-12', '2010-01', '2010-02']);
		assert.deepEqual(dimension.getItems('year'), ['2009', '2010']);
	});

	it('should compute child items for all attributes', function () {
		assert.equal(dimension.getGroupItemFromRootItem('month', '2010-01'), '2010-01');
		assert.equal(dimension.getGroupItemFromRootItem('year', '2010-01'), '2010');
	});

	it('should compute child indexes for all attributes', function () {
		assert.equal(dimension.getGroupIndexFromRootIndex('month', 0), 0);
		assert.equal(dimension.getGroupIndexFromRootIndex('month', 1), 1);

		assert.equal(dimension.getGroupIndexFromRootIndex('year', 0), 0);
		assert.equal(dimension.getGroupIndexFromRootIndex('year', 1), 1);
	});

	it('should drill up', function () {
		let childDim = dimension.drillUp('quarter');
		assert.sameMembers(childDim.attributes, ['quarter', 'semester', 'year', 'all']);
		assert.deepEqual(childDim.getItems(), ['2009-Q4', '2010-Q1']);
	});

	it('should drill down', function () {
		let childDim = dimension.drillDown('week_mon');
		assert.sameMembers(childDim.attributes, ['week_mon', 'month', 'quarter', 'semester', 'year', 'all']);
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

		const intersection = dimension.intersect(otherDimension);
		assert.equal(intersection.numItems, 0);
		assert.deepEqual(intersection.getItems(), []);
	});

	it('should union two dimensions', function () {
		const otherDimension = new TimeDimension('time', 'quarter', '2010-Q3', '2010-Q4');

		const union = dimension.union(otherDimension);
		assert.equal(union.rootAttribute, 'quarter');
		assert.deepEqual(union.getItems(), ['2009-Q4', '2010-Q1', '2010-Q2', '2010-Q3', '2010-Q4']);
	});

	it('should work when serialized', function () {
		const newDimension = TimeDimension.deserialize(dimension.serialize());
		assert.deepEqual(dimension.getItems(), newDimension.getItems());
		assert.deepEqual(dimension.getItems('quarter'), newDimension.getItems('quarter'));
	});

	it('should allow dice on both start and end', function () {
		const newDimension = dimension.diceRange('month', '2010-01', '2010-01');
		assert.deepEqual(newDimension.getItems(), ['2010-01']);
	});

	it('should allow dice when going further with start', function () {
		const newDimension = dimension.diceRange('month', '2000-01', '2020-01');
		assert.deepEqual(newDimension.getItems(), ['2009-12', '2010-01', '2010-02']);
	});

	it('should allow dice when going further with end', function () {
		const newDimension = dimension.diceRange('month', '2010-01', '2020-01');
		assert.deepEqual(newDimension.getItems(), ['2010-01', '2010-02']);
	});

	it('should allow dice when providing only begin', function () {
		const newDimension = dimension.diceRange('month', '2010-01', null);
		assert.deepEqual(newDimension.getItems(), ['2010-01', '2010-02']);
	});

	it('should allow dice when providing only end', function () {
		const newDimension = dimension.diceRange('month', null, '2010-01');
		assert.deepEqual(newDimension.getItems(), ['2009-12', '2010-01']);
	});


	it('should be able to humanize root attribute labels', function () {
		assert.deepEqual(
			dimension.getEntries(),
			[['2009-12', 'December 2009'], ['2010-01', 'January 2010'], ['2010-02', 'February 2010']]
		);
	});

	it('should be able to humanize other labels', function () {
		assert.deepEqual(
			dimension.getEntries('quarter', 'fr'),
			[['2009-Q4', '4ème trim. 2009'], ['2010-Q1', '1er trim. 2010']]
		);
	});

	it('should be able to humanize labels after drillingUp', function () {
		const newDimension = dimension.drillUp('quarter');

		assert.deepEqual(
			newDimension.getEntries(null, 'fr'),
			[['2009-Q4', '4ème trim. 2009'], ['2010-Q1', '1er trim. 2010']]
		);
	});

	it('should be able to humanize labels after dice', function () {
		const newDimension = dimension.dice('quarter', ['2010-Q1']);

		assert.deepEqual(
			newDimension.getEntries(),
			[['2010-01', 'January 2010'], ['2010-02', 'February 2010']]
		);

		assert.deepEqual(
			newDimension.getEntries('quarter', 'fr'),
			[['2010-Q1', '1er trim. 2010']]
		);
	});


});

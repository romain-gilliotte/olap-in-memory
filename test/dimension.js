const assert = require('chai').assert;
const Dimension = require('../src/dimension');

describe('Dimension', function () {

	it('should give proper sizes', function () {
		const dim = new Dimension(
			'location',
			'city',
			['paris', 'toulouse', 'madrid', 'beirut']
		);

		dim.addChildAttribute(
			'city',
			'cityNumLetters',
			city => city.length.toString(),
			'france'
		)

		dim.addChildAttribute(
			'city',
			'country',
			{ 'madrid': 'spain', 'beirut': 'lebanon' },
			'france'
		);

		dim.addChildAttribute(
			'country',
			'continent',
			{ 'lebanon': 'asia' },
			'europe'
		);

		assert.equal(dim.numItems, 4);
		assert.equal(dim.rootAttribute, 'city');
		assert.deepEqual(dim.attributes, ['city', 'cityNumLetters', 'country', 'continent']);

		assert.equal(dim.getChildItem('cityNumLetters', 'madrid'), '6');
		assert.equal(dim.getChildItem('country', 'madrid'), 'spain');
		assert.equal(dim.getChildItem('continent', 'madrid'), 'europe');

		let childDim = dim.drillUp('country');
		assert.deepEqual(childDim.attributes, ['country', 'continent'])

		let childDim2 = dim.drillUp('cityNumLetters');
		assert.deepEqual(childDim2.attributes, ['cityNumLetters'])

		let childDim3 = dim.dice('country', ['spain', 'lebanon']);


	});

	it('should create a time dimension', () => {
		const dim = Dimension.createTime('2009-12-17', '2010-02-23', 'week_sat');
	})


});


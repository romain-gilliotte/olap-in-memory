const assert = require('chai').assert;
const { GenericDimension } = require('../src');

describe('GenericDimension', function () {

    let dimension;

    before(function () {
        dimension = new GenericDimension(
            'location',
            'city',
            ['paris', 'toulouse', 'madrid', 'beirut'],
            item => 'city of ' + item
        );

        dimension.addChildAttribute(
            'city',
            'cityNumLetters',
            city => city.length.toString(),
            { '5': 'five', '6': 'six', '8': 'eigth' }
        )

        dimension.addChildAttribute(
            'city',
            'country',
            { 'madrid': 'spain', 'beirut': 'lebanon', 'paris': 'france', 'toulouse': 'france' },
            item => 'country of ' + item
        );

        dimension.addChildAttribute(
            'country',
            'continent',
            item => item === 'lebanon' ? 'asia' : 'europe',
            { 'asia': 'The huge continent', 'europe': 'The old continent' }
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

    it('should work when serialized', function () {
        const newDimension = GenericDimension.deserialize(dimension.serialize());

        assert.deepEqual(dimension, newDimension);
    });

    it('should be able to humanize root attribute labels', function () {
        assert.deepEqual(
            dimension.getEntries(),
            [
                ['paris', 'city of paris'],
                ['toulouse', 'city of toulouse'],
                ['madrid', 'city of madrid'],
                ['beirut', 'city of beirut']
            ]
        );
    });

    it('should be able to humanize other labels', function () {
        assert.deepEqual(
            dimension.getEntries('cityNumLetters'),
            [['5', 'five'], ['8', 'eigth'], ['6', 'six']]
        );
    });

    it('should be able to humanize labels after drillingUp', function () {
        const newDimension = dimension.drillUp('cityNumLetters');

        assert.deepEqual(
            newDimension.getEntries(),
            [['5', 'five'], ['8', 'eigth'], ['6', 'six']]
        );
    });

    it('should be able to humanize labels after dice', function () {
        const newDimension = dimension.dice('cityNumLetters', ['6', '5']);

        assert.deepEqual(
            newDimension.getEntries(),
            [
                ['paris', 'city of paris'],
                ['madrid', 'city of madrid'],
                ['beirut', 'city of beirut']
            ]
        );

        assert.deepEqual(
            newDimension.getEntries('cityNumLetters'),
            [['5', 'five'], ['6', 'six']]
        );
    });

});


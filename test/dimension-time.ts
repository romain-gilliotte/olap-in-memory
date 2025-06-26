import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import TimeDimension from '../src/dimension/time';

describe('TimeDimension', function () {
    let dimension: any;

    beforeAll(function () {
        dimension = new TimeDimension('time', 'month', '2009-12', '2010-02');
    });

    it('should give proper sizes', function () {
        expect(dimension.numItems).toBe(3);
    });

    it('should give proper attributes', function () {
        expect(dimension.rootAttribute).toBe('month');
        expect(dimension.attributes.sort()).toEqual(
            ['month', 'quarter', 'semester', 'year', 'all'].sort()
        );
    });

    it('should compute items for all attributes', function () {
        expect(dimension.getItems()).toEqual(['2009-12', '2010-01', '2010-02']);
        expect(dimension.getItems('month')).toEqual(['2009-12', '2010-01', '2010-02']);
        expect(dimension.getItems('year')).toEqual(['2009', '2010']);
    });

    it('should compute child items for all attributes', function () {
        expect(dimension.getGroupItemFromRootItem('month', '2010-01')).toBe('2010-01');
        expect(dimension.getGroupItemFromRootItem('year', '2010-01')).toBe('2010');
    });

    it('should compute child indexes for all attributes', function () {
        expect(dimension.getGroupIndexFromRootIndex('month', 0)).toBe(0);
        expect(dimension.getGroupIndexFromRootIndex('month', 1)).toBe(1);

        expect(dimension.getGroupIndexFromRootIndex('year', 0)).toBe(0);
        expect(dimension.getGroupIndexFromRootIndex('year', 1)).toBe(1);
    });

    it('should drill up', function () {
        let childDim = dimension.drillUp('quarter');
        expect(childDim.attributes.sort()).toEqual(['quarter', 'semester', 'year', 'all'].sort());
        expect(childDim.getItems()).toEqual(['2009-Q4', '2010-Q1']);
    });

    it('should drill down', function () {
        let childDim = dimension.drillDown('week_mon');
        expect(childDim.attributes.sort()).toEqual(
            ['week_mon', 'month', 'quarter', 'semester', 'year', 'all'].sort()
        );
        expect(childDim.getItems()).toEqual([
            '2009-W49-mon',
            '2009-W50-mon',
            '2009-W51-mon',
            '2009-W52-mon',
            '2009-W53-mon',
            '2010-W01-mon',
            '2010-W02-mon',
            '2010-W03-mon',
            '2010-W04-mon',
            '2010-W05-mon',
            '2010-W06-mon',
            '2010-W07-mon',
            '2010-W08-mon',
        ]);
    });

    it('should intersect to dimensions with the same rootAttribute', function () {
        const otherDimension = new TimeDimension('time', 'month', '2010-01', '2010-02');

        const intersection = dimension.intersect(otherDimension);
        expect(intersection.rootAttribute).toBe('month');
        expect(intersection.getItems()).toEqual(['2010-01', '2010-02']);
    });

    it('should intersect to dimensions with different rootAttribute', function () {
        const otherDimension = new TimeDimension('time', 'quarter', '2010-Q1', '2010-Q2');

        const intersection = dimension.intersect(otherDimension);
        expect(intersection.rootAttribute).toBe('quarter');
        expect(intersection.getItems()).toEqual(['2010-Q1']);
    });

    it('should raise when intersecting dimensions with no common items', function () {
        const otherDimension = new TimeDimension('time', 'quarter', '2010-Q3', '2010-Q4');

        const intersection = dimension.intersect(otherDimension);
        expect(intersection.numItems).toBe(0);
        expect(intersection.getItems()).toEqual([]);
    });

    it('should union two dimensions', function () {
        const otherDimension = new TimeDimension('time', 'quarter', '2010-Q3', '2010-Q4');

        const union = dimension.union(otherDimension);
        expect(union.rootAttribute).toBe('quarter');
        expect(union.getItems()).toEqual(['2009-Q4', '2010-Q1', '2010-Q2', '2010-Q3', '2010-Q4']);
    });

    it('should work when serialized', function () {
        const newDimension = TimeDimension.deserialize(dimension.serialize());
        expect(dimension.getItems()).toEqual(newDimension.getItems());
        expect(dimension.getItems('quarter')).toEqual(newDimension.getItems('quarter'));
    });

    it('should allow dice on both start and end', function () {
        const newDimension = dimension.diceRange('month', '2010-01', '2010-01');
        expect(newDimension.getItems()).toEqual(['2010-01']);
    });

    it('should allow dice when going further with start', function () {
        const newDimension = dimension.diceRange('month', '2000-01', '2020-01');
        expect(newDimension.getItems()).toEqual(['2009-12', '2010-01', '2010-02']);
    });

    it('should allow dice when going further with end', function () {
        const newDimension = dimension.diceRange('month', '2010-01', '2020-01');
        expect(newDimension.getItems()).toEqual(['2010-01', '2010-02']);
    });

    it('should allow dice when providing only begin', function () {
        const newDimension = dimension.diceRange('month', '2010-01', null);
        expect(newDimension.getItems()).toEqual(['2010-01', '2010-02']);
    });

    it('should allow dice when providing only end', function () {
        const newDimension = dimension.diceRange('month', null, '2010-01');
        expect(newDimension.getItems()).toEqual(['2009-12', '2010-01']);
    });

    it('should be able to humanize root attribute labels', function () {
        expect(dimension.getEntries()).toEqual([
            ['2009-12', 'December 2009'],
            ['2010-01', 'January 2010'],
            ['2010-02', 'February 2010'],
        ]);
    });

    it('should be able to humanize other labels', function () {
        expect(dimension.getEntries('quarter', 'fr')).toEqual([
            ['2009-Q4', '4ème trim. 2009'],
            ['2010-Q1', '1er trim. 2010'],
        ]);
    });

    it('should be able to humanize labels after drillingUp', function () {
        const newDimension = dimension.drillUp('quarter');

        expect(newDimension.getEntries(null, 'fr')).toEqual([
            ['2009-Q4', '4ème trim. 2009'],
            ['2010-Q1', '1er trim. 2010'],
        ]);
    });

    it('should be able to humanize labels after dice', function () {
        const newDimension = dimension.dice('quarter', ['2010-Q1']);

        expect(newDimension.getEntries()).toEqual([
            ['2010-01', 'January 2010'],
            ['2010-02', 'February 2010'],
        ]);

        expect(newDimension.getEntries('quarter', 'fr')).toEqual([['2010-Q1', '1er trim. 2010']]);
    });
});

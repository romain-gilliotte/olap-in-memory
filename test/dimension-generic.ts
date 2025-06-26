import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import { GenericDimension } from '../src';

describe('GenericDimension', function () {
    let dimension: GenericDimension;

    beforeAll(function () {
        dimension = new GenericDimension(
            'location',
            'city',
            ['paris', 'toulouse', 'madrid', 'beirut'],
            'Location',
            (item: string) => 'city of ' + item
        );

        dimension.addAttribute('city', 'cityNumLetters', (city: string) => city.length.toString(), {
            5: 'five',
            6: 'six',
            8: 'eigth',
        });

        dimension.addAttribute(
            'city',
            'country',
            { madrid: 'spain', beirut: 'lebanon', paris: 'france', toulouse: 'france' },
            (item: string) => 'country of ' + item
        );

        dimension.addAttribute(
            'country',
            'continent',
            (item: string) => (item === 'lebanon' ? 'asia' : 'europe'),
            { asia: 'The huge continent', europe: 'The old continent' }
        );
    });

    it('should give proper sizes', function () {
        expect(dimension.numItems).toBe(4);
    });

    it('should give proper attributes', function () {
        expect(dimension.rootAttribute).toBe('city');
        expect(dimension.attributes.sort()).toEqual([
            'city',
            'cityNumLetters',
            'country',
            'continent',
            'all',
        ].sort());
    });

    it('should compute items for all attributes', function () {
        expect(dimension.getItems()).toEqual(['paris', 'toulouse', 'madrid', 'beirut']);
        expect(dimension.getItems('city')).toEqual(['paris', 'toulouse', 'madrid', 'beirut']);
        expect(dimension.getItems('cityNumLetters')).toEqual(['5', '8', '6']);
    });

    it('should compute child items for all attributes', function () {
        expect(dimension.getGroupItemFromRootItem('city', 'paris')).toBe('paris');
        expect(dimension.getGroupItemFromRootItem('cityNumLetters', 'paris')).toBe('5');
        expect(dimension.getGroupItemFromRootItem('country', 'madrid')).toBe('spain');
        expect(dimension.getGroupItemFromRootItem('continent', 'madrid')).toBe('europe');
    });

    it('should compute child indexes', function () {
        // Can't test protected method getGroupIndexFromRootIndex directly
        // Test through public method getGroupIndexFromRootItem instead
        expect(dimension.getGroupIndexFromRootItem('city', 'paris')).toBe(0);
        expect(dimension.getGroupIndexFromRootItem('cityNumLetters', 'paris')).toBe(0);
        expect(dimension.getGroupIndexFromRootItem('country', 'toulouse')).toBe(0);
        expect(dimension.getGroupIndexFromRootItem('continent', 'madrid')).toBe(0); // madrid -> spain -> europe (index 0)
    });

    it('should drill up', function () {
        let childDim = dimension.drillUp('country');
        expect(childDim.attributes.sort()).toEqual(['country', 'continent', 'all'].sort());
        expect(childDim.getItems()).toEqual(['france', 'spain', 'lebanon']);

        let childDim2 = dimension.drillUp('cityNumLetters');
        expect(childDim2.attributes.sort()).toEqual(['cityNumLetters', 'all'].sort());
    });

    it('should intersect to dimensions with the same rootAttribute', function () {
        const otherDimension = new GenericDimension('location', 'city', [
            'toulouse',
            'madrid',
            'amman',
            'paris',
        ]);

        const intersection = dimension.intersect(otherDimension);
        expect(intersection.rootAttribute).toBe('city');
        expect(intersection.getItems()).toEqual(['paris', 'toulouse', 'madrid']);
    });

    it('should intersect to dimensions with different rootAttribute', function () {
        const otherDimension = new GenericDimension('location', 'country', [
            'france',
            'spain',
            'jordan',
        ]);

        const intersection = dimension.intersect(otherDimension);
        expect(intersection.rootAttribute).toBe('country');
        expect(intersection.getItems()).toEqual(['france', 'spain']);
    });

    it('should raise when intersecting dimensions with no common items', function () {
        const otherDimension = new GenericDimension('location', 'city', [
            'lyon',
            'barcelona',
            'narbonne',
        ]);

        const newDimension = dimension.intersect(otherDimension);
        expect(newDimension.numItems).toBe(0);
        expect(newDimension.getItems()).toEqual([]);
    });

    it('should raise when intersecting dimensions with no common attribute', function () {
        const otherDimension = new GenericDimension('location', 'postalcode', ['75018', '75019']);

        expect(() => dimension.intersect(otherDimension)).toThrow();
    });

    it('should union', function () {
        const otherDimension = new GenericDimension(
            'location',
            'city',
            ['lyon'],
            'Location',
            (item: string) => 'great city of ' + item
        );

        otherDimension.addAttribute(
            'city',
            'country',
            (item: string) => 'france',
            (item: string) => 'country of ' + item
        );

        const result = dimension.union(otherDimension);
        expect(result.attributes).toEqual(['all', 'city', 'country']);
        expect(result.getGroupItemFromRootItem('country', 'lyon')).toEqual('france');
        expect(result.getGroupItemFromRootItem('country', 'paris')).toEqual('france');
        expect(result.getEntries()).toEqual([
            ['paris', 'city of paris'],
            ['toulouse', 'city of toulouse'],
            ['madrid', 'city of madrid'],
            ['beirut', 'city of beirut'],
            ['lyon', 'great city of lyon'],
        ]);
    });

    it('should work when serialized', function () {
        const newDimension = GenericDimension.deserialize(dimension.serialize());

        expect(newDimension.getItems()).toEqual(dimension.getItems());
    });

    it('should be able to humanize root attribute labels', function () {
        expect(dimension.getEntries()).toEqual([
            ['paris', 'city of paris'],
            ['toulouse', 'city of toulouse'],
            ['madrid', 'city of madrid'],
            ['beirut', 'city of beirut'],
        ]);
    });

    it('should be able to humanize other labels', function () {
        expect(dimension.getEntries('cityNumLetters')).toEqual([
            ['5', 'five'],
            ['8', 'eigth'],
            ['6', 'six'],
        ]);
    });

    it('should be able to humanize labels after drillingUp', function () {
        const newDimension = dimension.drillUp('cityNumLetters');

        expect(newDimension.getEntries()).toEqual([
            ['5', 'five'],
            ['8', 'eigth'],
            ['6', 'six'],
        ]);
    });

    it('should be able to humanize labels after dice', function () {
        const newDimension = dimension.dice('cityNumLetters', ['6', '5']);

        expect(newDimension.getEntries()).toEqual([
            ['paris', 'city of paris'],
            ['madrid', 'city of madrid'],
            ['beirut', 'city of beirut'],
        ]);

        expect(newDimension.getEntries('cityNumLetters')).toEqual([
            ['5', 'five'],
            ['6', 'six'],
        ]);
    });
});

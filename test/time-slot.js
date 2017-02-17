import assert from 'assert';
import {TimeSlot} from '../dist/olap';

describe("TimeSlot should guess periodicity automatically", () => {

	it("should work with year format", () => {
		let ts = new TimeSlot('2010');
		assert.equal(ts.periodicity, 'year');
	});

	it("should work with quarter format", () => {
		let ts = new TimeSlot('2010-Q1');
		assert.equal(ts.periodicity, 'quarter');
	});

	it("should work with month format", () => {
		let ts = new TimeSlot('2010-10');
		assert.equal(ts.periodicity, 'month');
	});

	it("should work with week_sat formats", () => {
		let ts = new TimeSlot('2010-W01-sat');
		assert.equal(ts.periodicity, 'week_sat');
	});

	it("should work with week_sun formats", () => {
		let ts = new TimeSlot('2010-W01-sun');
		assert.equal(ts.periodicity, 'week_sun');
	});

	it("should work with week_mon formats", () => {
		let ts = new TimeSlot('2010-W01-mon');
		assert.equal(ts.periodicity, 'week_mon');
	});

	it("should work with day formats", () => {
		let ts = new TimeSlot('2010-01-02');
		assert.equal(ts.periodicity, 'day');
	});

});

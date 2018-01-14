import assert from 'assert';
import TimeSlot from '../src/time-slot';


describe("TimeSlot", () => {

	describe(".periodicity", () => {

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

		it("should work with month_week_sat formats", () => {
			let ts = new TimeSlot('2010-05-W1-sat');
			assert.equal(ts.periodicity, 'month_week_sat');
		});

		it("should work with month_week_sun formats", () => {
			let ts = new TimeSlot('2010-05-W1-sun');
			assert.equal(ts.periodicity, 'month_week_sun');
		});

		it("should work with month_week_mon formats", () => {
			let ts = new TimeSlot('2010-05-W1-mon');
			assert.equal(ts.periodicity, 'month_week_mon');
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

	describe(".firstDate", () => {

		it("should work with month_week_sun formats", () => {
			let ts;
			ts = new TimeSlot('2017-05-W1-sun');
			assert.equal(ts.firstDate.getUTCDate(), 1);

			ts = new TimeSlot('2017-05-W2-sun');
			assert.equal(ts.firstDate.getUTCDate(), 7);

			ts = new TimeSlot('2017-05-W5-sun');
			assert.equal(ts.firstDate.getUTCDate(), 28);
		});

	});

	describe(".lastDate", () => {

		it("should work with month_week_sun formats", () => {
			let ts;
			ts = new TimeSlot('2017-05-W1-sun');
			assert.equal(ts.lastDate.getUTCDate(), 6);

			ts = new TimeSlot('2017-05-W2-sun');
			assert.equal(ts.lastDate.getUTCDate(), 13);

			ts = new TimeSlot('2017-05-W5-sun');
			assert.equal(ts.lastDate.getUTCDate(), 31);
		});

	});

	describe(".next()", () => {

		it("should work with month_week_sun formats", () => {
			let ts = new TimeSlot('2017-05-W1-sun');

			ts = ts.next(); assert.equal(ts.value, '2017-05-W2-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-05-W3-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-05-W4-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-05-W5-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-06-W1-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-06-W2-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-06-W3-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-06-W4-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-06-W5-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W1-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W2-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W3-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W4-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W5-sun');
			ts = ts.next(); assert.equal(ts.value, '2017-07-W6-sun');
		});

	});

	describe(".toUpperSlot()", () => {

	});

});


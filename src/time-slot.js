
/**
 * A class representing a time slot used in monitoring.
 * This can be a given day, epidemiological week, month, quarter, ...
 */
export default class TimeSlot {

	/**
	 * @param  {Date} utcDate Date which we want to build the TimeSlot around
	 * @param  {string} periodicity One of day, week_sat, week_sun, week_mon, month, quarter, semester, year
	 * @return {TimeSlot} The TimeSlot instance of the given periodicity containing utcDate
	 *
	 * @example
	 * let ts = TimeSlot.fromDate(new Date(2010, 01, 07, 18, 34), "month");
	 * ts.value // '2010-01'
	 *
	 * let ts2 = TimeSlot.fromDate(new Date(2010, 12, 12, 6, 21), "quarter");
	 * ts2.value // '2010-Q4'
	 */
	static fromDate(utcDate, periodicity) {

		if (periodicity === 'day')
			return new TimeSlot(utcDate.toISOString().substring(0, 10));

		else if (periodicity === 'month_week_sat' || periodicity === 'month_week_sun' || periodicity === 'month_week_mon') {
			var prefix = utcDate.toISOString().substring(0, 8);

			// if no sunday happened in the month OR month start with sunday, week number is one.
			var firstDayOfMonth = new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), 1)).getUTCDay();

			var firstWeekLength;
			if (periodicity === 'month_week_sat')
				firstWeekLength = 7 - ((firstDayOfMonth + 1) % 7);
			else if (periodicity === 'month_week_sun')
				firstWeekLength = 7 - firstDayOfMonth; // 1 if month start on saturday, 2 if friday, 7 if sunday
			else
				firstWeekLength = 7 - ((firstDayOfMonth - 1 + 7) % 7);

			if (utcDate.getUTCDate() <= firstWeekLength) {
				return new TimeSlot(prefix + 'W1-' + periodicity.substr(-3));
			}
			else {
				var weekNumber = Math.floor((utcDate.getUTCDate() - 1 - firstWeekLength) / 7) + 2;
				return new TimeSlot(prefix + 'W' + weekNumber + '-' + periodicity.substr(-3));
			}
		}

		else if (periodicity === 'week_sat' || periodicity === 'week_sun' || periodicity === 'week_mon') {
			// Good epoch to count week is the first inferior to searched date (among next, current and last year, in that order).
			var year = utcDate.getUTCFullYear() + 1,
				epoch = TimeSlot._getEpidemiologicWeekEpoch(year, periodicity);

			while (utcDate.getTime() < epoch.getTime())
				epoch = TimeSlot._getEpidemiologicWeekEpoch(--year, periodicity);

			var weekNumber = Math.floor((utcDate.getTime() - epoch.getTime()) / 1000 / 60 / 60 / 24 / 7) + 1;
			if (weekNumber < 10)
				weekNumber = '0' + weekNumber;

			return new TimeSlot(year + '-W' + weekNumber + '-' + periodicity.substr(-3));
		}

		else if (periodicity === 'month')
			return new TimeSlot(utcDate.toISOString().substring(0, 7));

		else if (periodicity === 'quarter')
			return new TimeSlot(
				utcDate.getUTCFullYear().toString() +
				'-Q' + (1 + Math.floor(utcDate.getUTCMonth() / 3)).toString()
			);

		else if (periodicity === 'semester')
			return new TimeSlot(
				utcDate.getUTCFullYear().toString() +
				'-S' + (1 + Math.floor(utcDate.getUTCMonth() / 6)).toString()
			)

		else if (periodicity === 'year')
			return new TimeSlot(utcDate.getUTCFullYear().toString());

		else
			throw new Error("Invalid periodicity");
	}

	/**
	 * Get the date from which we should count weeks to compute the epidemiological week number.
	 *
	 * @private
	 * @todo
	 * This function is incredibly verbose for what it does.
	 * Probably a single divmod could give the same result but debugging was nightmarish.
	 *
	 * @param  {number} year
	 * @param  {string} periodicity
	 * @return {Date}
	 */
	static _getEpidemiologicWeekEpoch(year, periodicity) {
		var SUNDAY = 0, MONDAY = 1, TUESDAY = 2, WEDNESDAY = 3, THURSDAY = 4, FRIDAY = 5, SATURDAY = 6;
		var firstDay = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).getUTCDay();
		var epoch = null;

		if (periodicity === 'week_sun') {
			if (firstDay === SUNDAY)
				// Lucky us, first day of year is Sunday
				epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
			else if (firstDay === MONDAY)
				// Epidemiologic week started last day of december
				epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
			else if (firstDay === TUESDAY)
				// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
				epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
			else if (firstDay === WEDNESDAY)
				// 3 days in december, 4 in january
				epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
			else if (firstDay === THURSDAY)
				// we can't have 4 days in december, so the epoch is the 4th of january (the first sunday of the year)
				epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
			else if (firstDay === FRIDAY)
				// same as before: first sunday of the year
				epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
			else if (firstDay === SATURDAY)
				// same as before: first sunday of the year
				epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
		}
		else if (periodicity === 'week_sat') {
			if (firstDay === SATURDAY)
				// Lucky us, first day of year is Saturday
				epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
			else if (firstDay === SUNDAY)
				// Epidemiologic week started last day of december
				epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
			else if (firstDay === MONDAY)
				// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
				epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
			else if (firstDay === TUESDAY)
				// 3 days in december, 4 in january
				epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
			else if (firstDay === WEDNESDAY)
				// we can't have 4 days in december, so the epoch is the 4th of january (the first saturday of the year)
				epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
			else if (firstDay === THURSDAY)
				// same as before: first saturday of the year
				epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
			else if (firstDay === FRIDAY)
				// same as before: first saturday of the year
				epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
		}
		else if (periodicity === 'week_mon') {
			if (firstDay === MONDAY)
				// Lucky us, first day of year is Sunday
				epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
			else if (firstDay === TUESDAY)
				// Epidemiologic week started last day of december
				epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
			else if (firstDay === WEDNESDAY)
				// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
				epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
			else if (firstDay === THURSDAY)
				// 3 days in december, 4 in january
				epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
			else if (firstDay === FRIDAY)
				// we can't have 4 days in december, so the epoch is the 4th of january (the first monday of the year)
				epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
			else if (firstDay === SATURDAY)
				// same as before: first monday of the year
				epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
			else if (firstDay === SUNDAY)
				// same as before: first monday of the year
				epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
		}
		else
			throw new Error("Invalid day");

		return new Date(epoch);
	};

	/**
	 * Constructs a TimeSlot instance from a time slot value.
	 * The periodicity will be automatically computed.
	 *
	 * @param  {string} value A valid TimeSlot value (those can be found calling the `value` getter).
	 */
	constructor(value) {
		this._value = value;
	}

	/**
	 * The value of the TimeSlot.
	 * This is a string that uniquely identifies this timeslot.
	 *
	 * For instance: `2010`, `2010-Q1`, `2010-W07-sat`.
	 * @type {string}
	 */
	get value() {
		return this._value;
	}

	/**
	 * The periodicity used for this timeslot.
	 * By periodicity, we mean, the method that was used to cut time into slots.
	 *
	 * For instance: `year`, `quarter`, `week-sat`, ...
	 * @type {string}
	 */
	get periodicity() {
		if (!this._periodicity) {
			if (this.value.match(/^\d{4}$/))
				this._periodicity = 'year';

			else if (this.value.match(/^\d{4}\-S\d$/))
				this._periodicity = 'semester';

			else if (this.value.match(/^\d{4}\-Q\d$/))
				this._periodicity = 'quarter';

			else if (this.value.match(/^\d{4}\-\d{2}$/))
				this._periodicity = 'month';

			else if (this.value.match(/^\d{4}\-W\d{2}-sat$/))
				this._periodicity = 'week_sat';

			else if (this.value.match(/^\d{4}\-W\d{2}-sun$/))
				this._periodicity = 'week_sun';

			else if (this.value.match(/^\d{4}\-W\d{2}-mon$/))
				this._periodicity = 'week_mon';

			else if (this.value.match(/^\d{4}\-\d{2}\-W\d{1}-sat$/))
				this._periodicity = 'month_week_sat';

			else if (this.value.match(/^\d{4}\-\d{2}\-W\d{1}-sun$/))
				this._periodicity = 'month_week_sun';

			else if (this.value.match(/^\d{4}\-\d{2}\-W\d{1}-mon$/))
				this._periodicity = 'month_week_mon';

			else if (this.value.match(/^\d{4}\-\d{2}\-\d{2}$/))
				this._periodicity = 'day';
		}

		return this._periodicity;
	}

	/**
	 * The date where this instance of TimeSlot begins.
	 *
	 * @type {Date}
	 * @example
	 * var t = new TimeSlot('2012-01');
	 * t.firstDate.toUTCString(); // 2012-01-01T00:00:00Z
	 */
	get firstDate() {
		if (this.periodicity === 'day')
			return new Date(this.value + 'T00:00:00Z');

		else if (this.periodicity === 'month_week_sat' || this.periodicity === 'month_week_sun' || this.periodicity === 'month_week_mon') {
			var weekNumber = 1 * this.value.substr(9, 1);

			var firstDayOfMonth = new Date(this.value.substring(0, 7) + '-01T00:00:00Z').getUTCDay();
			if (weekNumber === 1)
				return new Date(Date.UTC(this.value.substring(0, 4), this.value.substring(5, 7) - 1, 1));

			else {
				var firstWeekLength;
				if (this.periodicity === 'month_week_sat')
					firstWeekLength = 7 - ((firstDayOfMonth + 1) % 7);
				else if (this.periodicity === 'month_week_sun')
					firstWeekLength = 7 - firstDayOfMonth; // 1 if month start on saturday, 2 if friday, 7 if sunday
				else
					firstWeekLength = 7 - ((firstDayOfMonth - 1 + 7) % 7);

				return new Date(Date.UTC(
					this.value.substring(0, 4),
					this.value.substring(5, 7) - 1,
					1 + firstWeekLength + (weekNumber - 2) * 7
				));
			}
		}

		else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon')
			return new Date(
				TimeSlot._getEpidemiologicWeekEpoch(this.value.substring(0, 4), this.periodicity).getTime() +
				(this.value.substring(6, 8) - 1) * 7 * 24 * 60 * 60 * 1000 // week numbering starts with 1
			);

		else if (this.periodicity === 'month')
			return new Date(this.value + '-01T00:00:00Z');

		else if (this.periodicity === 'quarter') {
			var month = (this.value.substring(6, 7) - 1) * 3 + 1;
			if (month < 10)
				month = '0' + month;

			return new Date(this.value.substring(0, 5) + month + '-01T00:00:00Z');
		}
		else if (this.periodicity === 'semester') {
			var month2 = (this.value.substring(6, 7) - 1) * 6 + 1;
			if (month2 < 10)
				month2 = '0' + month2;

			return new Date(this.value.substring(0, 5) + month2 + '-01T00:00:00Z');
		}
		else if (this.periodicity === 'year')
			return new Date(this.value + '-01-01T00:00:00Z');
	}

	/**
	 * The date where this instance of TimeSlot ends.
	 *
	 * @type {Date}
	 * @example
	 * var t = new TimeSlot('2012-01');
	 * t.firstDate.toUTCString(); // 2012-01-31T00:00:00Z
	 */
	get lastDate() {
		if (this.periodicity === 'day')
			// last day is current day
			return this.firstDate;

		else if (this.periodicity === 'month_week_sat' || this.periodicity === 'month_week_sun' || this.periodicity === 'month_week_mon') {
			var weekNumber = this.value.substr(9, 1);

			var firstDayOfMonth = new Date(this.value.substring(0, 7) + '-01T00:00:00Z').getUTCDay();
			var firstWeekLength;
			if (this.periodicity === 'month_week_sat')
				firstWeekLength = 7 - ((firstDayOfMonth + 1) % 7);
			else if (this.periodicity === 'month_week_sun')
				firstWeekLength = 7 - firstDayOfMonth; // 1 if month start on saturday, 2 if friday, 7 if sunday
			else
				firstWeekLength = 7 - ((firstDayOfMonth - 1 + 7) % 7);

			if (weekNumber === 1)
				return new Date(Date.UTC(this.value.substring(0, 4), this.value.substring(5, 7) - 1, firstWeekLength));
			else {
				var res = new Date(Date.UTC(
					this.value.substring(0, 4),
					this.value.substring(5, 7) - 1,
					1 + 6 + firstWeekLength + (weekNumber - 2) * 7
				));

				if (res.getUTCMonth() !== this.value.substring(5, 7) - 1)
					res.setUTCDate(0); // go to last day of previous month.

				return res;
			}
		}

		else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') {
			// last day is last day of the week according to epoch
			return new Date(this.firstDate.getTime() + 6 * 24 * 60 * 60 * 1000);
		}

		else if (this.periodicity === 'month') {
			var monthDate = this.firstDate;
			monthDate.setUTCMonth(monthDate.getUTCMonth() + 1); // add one month.
			monthDate.setUTCDate(0); // go to last day of previous month.
			return monthDate;
		}

		else if (this.periodicity === 'quarter') {
			var quarterDate = this.firstDate;
			quarterDate.setUTCMonth(quarterDate.getUTCMonth() + 3); // add three month.
			quarterDate.setUTCDate(0); // go to last day of previous month.
			return quarterDate;
		}

		else if (this.periodicity === 'semester') {
			var semesterDate = this.firstDate;
			semesterDate.setUTCMonth(semesterDate.getUTCMonth() + 6); // add six month.
			semesterDate.setUTCDate(0); // go to last day of previous month.
			return semesterDate;
		}

		else if (this.periodicity === 'year')
			return new Date(this.value + '-12-31T00:00:00Z');
	}

	/**
	 * Creates a TimeSlot instance with a longer periodicity that contains this one.
	 *
	 * @param  {string} newPeriodicity The desired periodicity
	 * @return {TimeSlot} A new TimeSlot instance.
	 *
	 * @example
	 * let t  = new TimeSlot('2010-07'),
	 *     t2 = t.toUpperSlot('quarter');
	 *
	 * t2.value; // 2010-Q3
	 */
	toUpperSlot(newPeriodicity) {
		// Raise when we make invalid conversions
		if (TimeSlot._upperSlots[this.periodicity].indexOf(newPeriodicity) === -1)
			throw new Error('Cannot convert ' + this.periodicity + ' to ' + newPeriodicity);

		// For days, months, quarters, semesters, we can assume that getting the slot from any date works
		var upperSlotDate = this.firstDate;

		// if it's a week, we need to be a bit more cautious.
		// the month/quarter/year is not that of the first or last day, but that of the middle day of the week
		// (which depend on the kind of week, but adding 3 days to the beginning gives the good date).
		if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon')
			upperSlotDate = new Date(upperSlotDate.getTime() + 3 * 24 * 60 * 60 * 1000);

		return TimeSlot.fromDate(upperSlotDate, newPeriodicity);
	}

	/**
	 * Creates a TimeSlot instance of the same periodicity than the current once, but which follows it
	 *
	 * @return {TimeSlot}
	 * @example
	 * var ts = new TimeSlot('2010');
	 * ts.next().value // 2011
	 *
	 * var ts2 = new TimeSlot('2010-W52-sat');
	 * ts.next().value // 2011-W01-sat
	 */
	next() {
		var date = this.lastDate;
		date.setUTCDate(date.getUTCDate() + 1);
		return TimeSlot.fromDate(date, this.periodicity);
	}
};

/**
 * Static member documenting which periodicity contains the others.
 *
 * @private
 * @type {Object}
 */
TimeSlot._upperSlots = {
	'day': ['month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'],
	'month_week_sat': ['week_sat', 'month', 'quarter', 'semester', 'year'],
	'month_week_sun': ['week_sun', 'month', 'quarter', 'semester', 'year'],
	'month_week_mon': ['week_mon', 'month', 'quarter', 'semester', 'year'],
	'week_sat': ['month', 'quarter', 'semester', 'year'],
	'week_sun': ['month', 'quarter', 'semester', 'year'],
	'week_mon': ['month', 'quarter', 'semester', 'year'],
	'month': ['quarter', 'semester', 'year'],
	'quarter': ['semester', 'year'],
	'semester': ['year'],
	'year': []
};

module.exports = TimeSlot;

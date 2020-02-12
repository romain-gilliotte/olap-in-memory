const TimeSlot = require('timeslot-dag');
const AbstractDimension = require('./abstract');

class TimeDimension extends AbstractDimension {

    get rootAttribute() {
        return this._rootAttribute;
    }

    get attributes() {
        return [this._rootAttribute, ...TimeSlot.upperSlots[this._rootAttribute]]
    }

    /**
     * 
     * @param {TimeSlotPeriodicity} rootAttribute 
     * @param {string} start 
     * @param {string} end 
     */
    constructor(rootAttribute, start, end) {
        super('time', rootAttribute);

        this._start = new TimeSlot(start, rootAttribute);
        this._end = new TimeSlot(end, rootAttribute);
    }

    getItems(attribute = null) {
        const end = this._end.toUpperSlot(attribute || this._rootAttribute);

        let period = this._start.toUpperSlot(attribute || this._rootAttribute);
        let result = [];
        while (period.value <= end.value) {
            result.push(period.value);
            period = period.next();
        }

        return result;
    }

    drillUp(newAttribute) {
        return new TimeDimension(
            newAttribute,
            this._start.toUpperSlot(newAttribute).value,
            this._end.toUpperSlot(newAttribute).value
        );
    }

    drillDown(newAttribute) {
        return new TimeDimension(
            newAttribute,
            TimeSlot.fromDate(this._start.startDate, newAttribute).value,
            TimeSlot.fromDate(this._end.endDate, newAttribute).value
        );
    }

    dice(attribute, start, end) {
        return new TimeDimension(
            this._rootAttribute,
            new TimeSlot(start),
            new TimeSlot(end),
        )
    }

	/**
	 * i.e. Get the value of the month from the day.
     * 
	 * @param  {[type]} attribute eg: 'month'
	 * @param  {[type]} value     '2010-01-01'
	 * @return {[type]}           '2010-01'
	 */
    getChildItem(attribute, value) {
        return new TimeSlot(value).toUpperSlot(attribute).value;
    }

	/**
	 * Get the month index corresponding to a given day.
     * 
	 * @param  {[type]} attribute eg: month
	 * @param  {[type]} index     32
	 * @return {[type]}           2
	 */
    getChildIndex(attribute, index) {
        const value = this.getItems(this._rootAttribute)[index];
        const childIndex = this.getItems(attribute).indexOf(value);

        if (childIndex !== -1) {
            return childIndex;
        }
        else {
            throw new Error(`No attribute ${attribute} was found on dimension ${this.id}`);
        }
    }

}

module.exports = TimeDimension;
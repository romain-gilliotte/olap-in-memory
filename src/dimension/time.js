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
        this._attributeItems = {};
        this._attributeMappings = {};
    }

    getItems(attribute = null) {
        if (!this._attributeItems[attribute || this._rootAttribute]) {
            const end = this._end.toUpperSlot(attribute || this._rootAttribute);
            const items = [];

            let period = this._start.toUpperSlot(attribute || this._rootAttribute);
            while (period.value <= end.value) {
                items.push(period.value);
                period = period.next();
            }

            this._attributeItems[attribute || this._rootAttribute] = items;
        }

        return this._attributeItems[attribute || this._rootAttribute];
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
            TimeSlot.fromDate(this._start.firstDate, newAttribute).value,
            TimeSlot.fromDate(this._end.lastDate, newAttribute).value
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
        if (!this._attributeMappings[attribute]) {
            const rootItems = this.getItems(this._rootAttribute);
            const attributeItems = this.getItems(attribute);

            this._attributeMappings[attribute] = rootItems.map(rootItem => {
                const attributeItem = this.getChildItem(attribute, rootItem);
                return attributeItems.indexOf(attributeItem);
            });
        }

        return this._attributeMappings[attribute][index];
    }
}

module.exports = TimeDimension;
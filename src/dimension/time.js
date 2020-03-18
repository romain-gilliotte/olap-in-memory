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
    constructor(dimensionId, rootAttribute, start, end) {
        super(dimensionId, rootAttribute);

        this._start = new TimeSlot(start, rootAttribute);
        this._end = new TimeSlot(end, rootAttribute);
        this._attributeItems = {};
        this._attributeMappings = {};

        if (this._start.value > this._end.value)
            throw new Error('Empty dimensions are not allowed');
    }

    getItems(attribute = null) {
        attribute = attribute || this._rootAttribute;

        if (!this._attributeItems[attribute]) {
            const end = this._end.toUpperSlot(attribute);
            const items = [];

            let period = this._start.toUpperSlot(attribute);
            while (period.value <= end.value) {
                items.push(period.value);
                period = period.next();
            }

            this._attributeItems[attribute] = items;
        }

        return this._attributeItems[attribute];
    }

    drillUp(newAttribute) {
        return new TimeDimension(
            this.id,
            newAttribute,
            this._start.toUpperSlot(newAttribute).value,
            this._end.toUpperSlot(newAttribute).value
        );
    }

    drillDown(newAttribute) {
        return new TimeDimension(
            this.id,
            newAttribute,
            TimeSlot.fromDate(this._start.firstDate, newAttribute).value,
            TimeSlot.fromDate(this._end.lastDate, newAttribute).value
        );
    }

    dice(attribute, items, reorder = false) {
        if (items.length === 1) {
            return this.diceRange(attribute, items[0], items[0]);
        }
        else {
            throw new Error('Unsupported');
        }
    }

    diceRange(attribute, start, end) {
        return new TimeDimension(
            this.id,
            this._rootAttribute,
            new TimeSlot(start).toUpperSlot(this._rootAttribute).value,
            new TimeSlot(end).toUpperSlot(this._rootAttribute).value,
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

    intersect(otherDimension) {
        if (this.id !== otherDimension.id)
            throw new Error('Not the same dimension');

        let rootAttribute;
        if (this.attributes.includes(otherDimension.rootAttribute))
            rootAttribute = otherDimension.rootAttribute;
        else if (otherDimension.attributes.includes(this.rootAttribute))
            rootAttribute = this.rootAttribute;
        else
            throw new Error(`The dimensions are not compatible`);

        const start = this._start.toUpperSlot(rootAttribute).value < otherDimension._start.toUpperSlot(rootAttribute).value ?
            otherDimension._start.toUpperSlot(rootAttribute).value :
            this._start.toUpperSlot(rootAttribute).value;

        const end = this._end.toUpperSlot(rootAttribute).value < otherDimension._end.toUpperSlot(rootAttribute).value ?
            this._end.toUpperSlot(rootAttribute).value :
            otherDimension._end.toUpperSlot(rootAttribute).value;

        return new TimeDimension(this.id, rootAttribute, start, end);
    }
}

module.exports = TimeDimension;
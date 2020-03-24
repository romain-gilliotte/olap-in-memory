const TimeSlot = require('timeslot-dag');
const AbstractDimension = require('./abstract');
const { toBuffer, fromBuffer } = require('../serialization');

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
    constructor(id, rootAttribute, start, end, label = null) {
        super(id, label, rootAttribute);

        this._start = new TimeSlot(start);
        this._end = new TimeSlot(end);
        this._attributeItems = {};
        this._attributeMappings = {};

        if (this._start.periodicity !== rootAttribute || this._end.periodicity !== rootAttribute)
            throw new Error('Periodicity does not match with provided boundaries');

        if (this._start.value > this._end.value)
            throw new Error('Empty dimensions are not allowed');
    }

    static deserialize(buffer) {
        const data = fromBuffer(buffer);
        return new TimeDimension(data.id, data.rootAttribute, data.start, data.end, data.label);
    }

    serialize() {
        return toBuffer({
            id: this.id,
            label: this.label,
            rootAttribute: this.rootAttribute,
            start: this._start.value,
            end: this._end.value
        });
    }

    getItems(attribute = null) {
        attribute = attribute || this._rootAttribute;

        if (!this._attributeItems[attribute]) {
            const end = this._end.toParentPeriodicity(attribute);
            const items = [];

            let period = this._start.toParentPeriodicity(attribute);
            while (period.value <= end.value) {
                items.push(period.value);
                period = period.next();
            }

            this._attributeItems[attribute] = items;
        }

        return this._attributeItems[attribute];
    }

    getEntries(attribute = null, language = 'en') {
        return this.getItems(attribute).map(item => [
            item,
            new TimeSlot(item).humanizeValue(language)
        ]);
    }

    drillUp(newAttribute) {
        if (newAttribute == this.rootAttribute)
            return this;

        return new TimeDimension(
            this.id,
            newAttribute,
            this._start.toParentPeriodicity(newAttribute).value,
            this._end.toParentPeriodicity(newAttribute).value,
            this.label
        );
    }

    drillDown(newAttribute) {
        if (newAttribute == this.rootAttribute)
            return this;

        if (!this._start.childPeriodicities.includes(newAttribute)) {
            throw new Error('Invalid periodicity.');
        }

        return new TimeDimension(
            this.id,
            newAttribute,
            TimeSlot.fromDate(this._start.firstDate, newAttribute).value,
            TimeSlot.fromDate(this._end.lastDate, newAttribute).value,
            this.label
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
        let newStart, newEnd;

        if (start) {
            const startTs = new TimeSlot(start);
            if (startTs.periodicity !== attribute)
                throw new Error(`${start} is not a valid slot of periodicity ${attribute}`);

            newStart = TimeSlot.fromDate(startTs.firstDate, this._rootAttribute).value;
        }
        else
            newStart = this._start.value;


        if (end) {
            const endTs = new TimeSlot(end);
            if (endTs.periodicity !== attribute)
                throw new Error(`${end} is not a valid slot of periodicity ${attribute}`);

            newEnd = TimeSlot.fromDate(endTs.lastDate, this._rootAttribute).value;
        }
        else
            newEnd = this._end.value;

        return new TimeDimension(
            this.id,
            this._rootAttribute,
            newStart < this._start.value ? this._start.value : newStart,
            newEnd < this._end.value ? newEnd : this._end.value,
            this.label
        );
    }

    /**
     * i.e. Get the value of the month from the day.
     * 
     * @param  {[type]} attribute eg: 'month'
     * @param  {[type]} value     '2010-01-01'
     * @return {[type]}           '2010-01'
     */
    getChildItem(attribute, value) {
        return new TimeSlot(value).toParentPeriodicity(attribute).value;
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

        const start = this._start.toParentPeriodicity(rootAttribute).value < otherDimension._start.toParentPeriodicity(rootAttribute).value ?
            otherDimension._start.toParentPeriodicity(rootAttribute).value :
            this._start.toParentPeriodicity(rootAttribute).value;

        const end = this._end.toParentPeriodicity(rootAttribute).value < otherDimension._end.toParentPeriodicity(rootAttribute).value ?
            this._end.toParentPeriodicity(rootAttribute).value :
            otherDimension._end.toParentPeriodicity(rootAttribute).value;

        return new TimeDimension(this.id, rootAttribute, start, end);
    }
}

module.exports = TimeDimension;
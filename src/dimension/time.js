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
        super(id, rootAttribute, label);

        this._start = TimeSlot.fromDate(new TimeSlot(start).firstDate, 'day');
        this._end = TimeSlot.fromDate(new TimeSlot(end).lastDate, 'day')
        this._attributeItems = {};
        this._attributeMappings = {};

        if (this._start.periodicity !== 'day' || this._end.periodicity !== 'day')
            throw new Error('Start and end must be dates.');

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
            let period = this._start.toParentPeriodicity(attribute);

            const items = [period.value];
            while (period.value < end.value) {
                period = period.next();
                items.push(period.value);
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
            this._start.value,
            this._end.value,
            this.label
        );
    }

    drillDown(newAttribute) {
        if (newAttribute == this.rootAttribute)
            return this;

        if (!TimeSlot.upperSlots[newAttribute].includes(this._rootAttribute)) {
            throw new Error('Invalid periodicity.');
        }

        return new TimeDimension(
            this.id,
            newAttribute,
            this._start.value,
            this._end.value,
            this.label
        );
    }

    dice(attribute, items, reorder = false) {
        if (items.length === 1)
            return this.diceRange(attribute, items[0], items[0]);

        // if reorder is true, it means we are supposed to keep the order
        // provided in the item list, otherwise we'll keep our chronological order.
        if (!reorder) {
            items = items.slice().sort();
        }

        // Check that items are ordered, have the good period, and that there are no gaps.
        let last = new TimeSlot(items[0]);
        if (last.periodicity !== attribute)
            throw new Error('Unsupported: wrong periodicity');

        for (let i = 1; i < items.length; ++i) {
            const current = new TimeSlot(items[i]);
            if (current.periodicity !== attribute || current.value !== last.next().value) {
                throw new Error('Unsupported: follow');
            }

            last = current;
        }

        return this.diceRange(attribute, items[0], items[items.length - 1]);
    }

    diceRange(attribute, start, end) {
        if (attribute === 'all')
            return this;

        let newStart, newEnd;

        if (start) {
            const startTs = new TimeSlot(start);
            if (startTs.periodicity !== attribute)
                throw new Error(`${start} is not a valid slot of periodicity ${attribute}`);

            newStart = TimeSlot.fromDate(startTs.firstDate, 'day').value;
        }
        else
            newStart = this._start.value;


        if (end) {
            const endTs = new TimeSlot(end);
            if (endTs.periodicity !== attribute)
                throw new Error(`${end} is not a valid slot of periodicity ${attribute}`);

            newEnd = TimeSlot.fromDate(endTs.lastDate, 'day').value;
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

        if (this.attributes.includes(otherDimension.rootAttribute))
            return otherDimension.diceRange('day', this._start.value, this._end.value);
        else if (otherDimension.attributes.includes(this.rootAttribute))
            return this.diceRange('day', otherDimension._start.value, otherDimension._end.value);
        else
            throw new Error(`The dimensions are not compatible`);
    }
}

module.exports = TimeDimension;
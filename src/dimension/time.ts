import {
    TimeSlot,
    TimeSlotPeriodicity,
    getParentPeriodicities,
    getChildPeriodicities,
} from 'timeslot-dag';
import AbstractDimension from './abstract';
import { toBuffer, fromBuffer } from '../serialization';

interface SerializedTimeDimension {
    id: string;
    label: string | null;
    rootAttribute: string;
    start: string;
    end: string;
}

class TimeDimension extends AbstractDimension {
    private _start: TimeSlot;
    private _end: TimeSlot;
    private _items: Record<string, string[]>;
    private _rootIdxToGroupIdx: Record<string, number[]>;

    get attributes(): string[] {
        return [
            this._rootAttribute,
            ...getParentPeriodicities(this._rootAttribute as TimeSlotPeriodicity),
        ];
    }

    constructor(
        id: string,
        rootAttribute: string,
        start: string,
        end: string,
        label: string | null = null
    ) {
        super(id, rootAttribute, label);

        this._start = TimeSlot.fromDate(
            TimeSlot.fromValue(start).firstDate,
            TimeSlotPeriodicity.Day
        );
        this._end = TimeSlot.fromDate(TimeSlot.fromValue(end).lastDate, TimeSlotPeriodicity.Day);
        this._items = {};
        this._rootIdxToGroupIdx = {};

        if (
            this._start.periodicity !== TimeSlotPeriodicity.Day ||
            this._end.periodicity !== TimeSlotPeriodicity.Day
        )
            throw new Error('Start and end must be dates.');
    }

    static deserialize(buffer: Buffer): TimeDimension {
        const data = fromBuffer(buffer) as unknown as SerializedTimeDimension;
        return new TimeDimension(data.id, data.rootAttribute, data.start, data.end, data.label);
    }

    serialize(): Buffer {
        return toBuffer({
            id: this.id,
            label: this.label,
            rootAttribute: this.rootAttribute,
            start: this._start.value,
            end: this._end.value,
        });
    }

    getItems(attribute: string | null = null): string[] {
        if (this._start.value > this._end.value) return [];

        const attr = attribute || this._rootAttribute;

        if (!this._items[attr]) {
            const end = this._end.toParentPeriodicity(attr as TimeSlotPeriodicity);
            let period = this._start.toParentPeriodicity(attr as TimeSlotPeriodicity);

            this._items[attr] = [period.value];
            while (period.value < end.value) {
                period = period.next();
                this._items[attr].push(period.value);
            }
        }

        return this._items[attr];
    }

    getEntries(attribute: string | null = null, language: string = 'en'): [string, string][] {
        return this.getItems(attribute).map(
            item => [item, TimeSlot.fromValue(item).humanizeValue(language)] as [string, string]
        );
    }

    drillUp(newAttribute: string): TimeDimension {
        if (newAttribute == this.rootAttribute) return this;

        return new TimeDimension(
            this.id,
            newAttribute,
            this._start.value,
            this._end.value,
            this.label
        );
    }

    drillDown(newAttribute: string): TimeDimension {
        if (newAttribute == this.rootAttribute) return this;

        if (
            !getChildPeriodicities(this._rootAttribute as TimeSlotPeriodicity).includes(
                newAttribute as TimeSlotPeriodicity
            )
        ) {
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

    dice(attribute: string, items: string[], reorder: boolean = false): TimeDimension {
        if (items.length === 1) return this.diceRange(attribute, items[0], items[0]);

        let sortedItems = items;
        if (!reorder) {
            sortedItems = items.slice().sort();
        }

        let last = TimeSlot.fromValue(sortedItems[0]);
        if (last.periodicity !== attribute) throw new Error('Unsupported: wrong periodicity');

        for (let i = 1; i < sortedItems.length; ++i) {
            const current = TimeSlot.fromValue(sortedItems[i]);
            if (current.periodicity !== attribute || current.value !== last.next().value) {
                throw new Error('Unsupported: follow');
            }

            last = current;
        }

        return this.diceRange(attribute, sortedItems[0], sortedItems[sortedItems.length - 1]);
    }

    diceRange(attribute: string, start: string | null, end: string | null): TimeDimension {
        if (attribute === 'all') {
            return this;
        }

        let newStart: string, newEnd: string;

        if (start) {
            const startTs = TimeSlot.fromValue(start);
            if (startTs.periodicity !== attribute)
                throw new Error(`${start} is not a valid slot of periodicity ${attribute}`);

            newStart = TimeSlot.fromDate(startTs.firstDate, TimeSlotPeriodicity.Day).value;
        } else newStart = this._start.value;

        if (end) {
            const endTs = TimeSlot.fromValue(end);
            if (endTs.periodicity !== attribute)
                throw new Error(`${end} is not a valid slot of periodicity ${attribute}`);

            newEnd = TimeSlot.fromDate(endTs.lastDate, TimeSlotPeriodicity.Day).value;
        } else newEnd = this._end.value;

        if (newStart <= this._start.value && this._end.value <= newEnd) {
            return this;
        }

        return new TimeDimension(
            this.id,
            this._rootAttribute,
            newStart < this._start.value ? this._start.value : newStart,
            newEnd < this._end.value ? newEnd : this._end.value,
            this.label
        );
    }

    getGroupIndexFromRootIndexMap(groupAttr: string): number[] {
        if (undefined === this._rootIdxToGroupIdx[groupAttr]) {
            this._checkAttribute(groupAttr);

            const rootItems = this.getItems();
            const groupItemsToIdx = this.getItemsToIdx(groupAttr);

            this._rootIdxToGroupIdx[groupAttr] = rootItems.map(rootItem => {
                const groupItem = TimeSlot.fromValue(rootItem).toParentPeriodicity(
                    groupAttr as TimeSlotPeriodicity
                ).value;
                return groupItemsToIdx[groupItem];
            });
        }

        return this._rootIdxToGroupIdx[groupAttr];
    }

    protected getGroupIndexFromRootIndex(groupAttr: string, rootIdx: number): number {
        if (undefined === this._rootIdxToGroupIdx[groupAttr]) {
            this.getGroupIndexFromRootIndexMap(groupAttr);
        }

        return this._rootIdxToGroupIdx[groupAttr][rootIdx];
    }

    union(otherDimension: TimeDimension): TimeDimension {
        if (this.id !== otherDimension.id) throw new Error('Not the same dimension');

        let rootAttribute: string;
        if (this.attributes.includes(otherDimension.rootAttribute))
            rootAttribute = otherDimension._rootAttribute;
        else if (otherDimension.attributes.includes(this.rootAttribute))
            rootAttribute = this._rootAttribute;
        else throw new Error(`The dimensions are not compatible`);

        const start =
            this._start.value < otherDimension._start.value
                ? this._start.value
                : otherDimension._start.value;
        const end =
            otherDimension._end.value < this._end.value
                ? this._end.value
                : otherDimension._end.value;
        return new TimeDimension(this.id, rootAttribute, start, end, this.label);
    }

    intersect(otherDimension: TimeDimension): TimeDimension {
        if (this.id !== otherDimension.id) throw new Error('Not the same dimension');

        if (this.attributes.includes(otherDimension.rootAttribute))
            return otherDimension.diceRange('day', this._start.value, this._end.value);
        else if (otherDimension.attributes.includes(this.rootAttribute))
            return this.diceRange('day', otherDimension._start.value, otherDimension._end.value);
        else throw new Error(`The dimensions are not compatible`);
    }
}

export default TimeDimension;

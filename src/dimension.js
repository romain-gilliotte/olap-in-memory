
import TimeSlot from './time-slot';

export class TimeDimensionItem {

	get groupKeys() {
		let ts = new TimeSlot(this.id);
		return TimeSlot._upperSlots[ts.periodicity];
	}

	constructor(id) {
		this.id = id;
	}

	getParentItem(group) {
		try {
			return new TimeDimensionItem(new TimeSlot(this.id).toUpperSlot(group).value);
		}
		catch (e) {
			return null;
		}
	}

}

export class StaticDimensionItem {

	get groupKeys() {
		return Object.keys(this.groups);
	}

	constructor(id, groups={}) {
		this.id = id;
		this.groups = groups;
	}

	getParentItem(group) {
		if (this.groups[group])
			return new StaticDimensionItem(this.groups[group]);
		else
			return null;
	}
}

export class Dimension {

	get numItems() {
		return this.items.length;
	}

	get groupKeys() {
		let a = {};

		this.items.forEach(item => {
			item.groupKeys.forEach(group => {
				a[group] = true;
			});
		});

		return Object.keys(a);
	}

	constructor(id, items) {
		this.id = id;
		this.items = items;
	}

	hasGroup(name) {
		return this.groupKeys.indexOf(name) !== -1;
	}

}

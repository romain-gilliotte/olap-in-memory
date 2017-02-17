(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.olap = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.CubeCollection = exports.Cube = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dimension = require("./dimension");

var _dimension2 = _interopRequireDefault(_dimension);

var _dimensionGroup = require("./dimension-group");

var _dimensionGroup2 = _interopRequireDefault(_dimensionGroup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AbstractCube = function () {
	function AbstractCube(id) {
		_classCallCheck(this, AbstractCube);

		this._id = id;
	}

	_createClass(AbstractCube, [{
		key: "query",
		value: function query(dimensionIds, filter, withTotals) {}
	}, {
		key: "id",
		get: function get() {
			return this._id;
		}
	}, {
		key: "dimensions",
		get: function get() {}
	}, {
		key: "dimensionGroups",
		get: function get() {}
	}]);

	return AbstractCube;
}();

/**
 * This class represents an [OLAP Cube](https://en.wikipedia.org/wiki/OLAP_cube)
 */


var Cube = exports.Cube = function (_AbstractCube) {
	_inherits(Cube, _AbstractCube);

	_createClass(Cube, [{
		key: "dimensions",
		get: function get() {
			return this._dimensions;
		}
	}, {
		key: "dimensionGroups",
		get: function get() {
			return this._dimensionGroups;
		}

		/**
   * Build a cube from it's components
   * 
   * @param {string} id A unique identifier for this cube across the application.
   * @param {Array.<Dimension>} dimensions The list of dimensions that this cube is using
   * @param {Array.<DimensionGroup>} dimensionGroups The list of dimension groups that this cube is using
   * @param {Array.<number>} data Data contained in the cube. The size of this array must be the product of the number of elements in the dimension.
   * 
   * @example
   * var time = new Dimension('year', ['2013', '2014', '2015'], 'sum'),
   *     location = new Dimension('location', ['shopA', 'shopB'], 'sum');
   * 
   * var c = new Cube('sells', [time, location], [], [10, 20, 30, 15, 43, 60]);
   */

	}], [{
		key: "fromSerialization",


		/**
   * Create a cube from the result of the serialize() method.
   * 
   * @param {Object} obj Object retrieved by calling the serialize method on a Cube instance.
   * @return {Cube}
   * 
   * @example
   * let c   = new Cube(...),
   *     str = JSON.stringify(c.serialize()),
   *     obj = JSON.parse(str),
   *     c2  = Cube.fromSerialization(obj);
   */
		value: function fromSerialization(obj) {
			return new Cube(obj.id, obj.dimensions, obj.dimensionGroups, obj.data);
		}
	}]);

	function Cube(id, dimensions, dimensionGroups, data) {
		_classCallCheck(this, Cube);

		// Check size.
		var _this = _possibleConstructorReturn(this, (Cube.__proto__ || Object.getPrototypeOf(Cube)).call(this, id));

		var dataSize = 1;
		dimensions.forEach(function (dimension) {
			dataSize *= dimension.items.length;
		});
		if (data.length !== dataSize) throw new Error('Invalid data size');

		_this._dimensions = dimensions;
		_this._dimensionGroups = dimensionGroups;
		_this._data = data;

		// Index dimensions and dimensionGroups by id
		_this._dimensionsById = {};
		_this._dimensionGroupsById = {};
		_this._dimensions.forEach(function (d) {
			this._dimensionsById[d.id] = d;
		}, _this);
		_this._dimensionGroups.forEach(function (d) {
			this._dimensionGroupsById[d.id] = d;
		}, _this);
		return _this;
	}

	/**
  * Query this cube splitting the result by the provided dimension ids and filters.
  *
  * @param {Array.<number>} dimensionIds Dimension to distribute the result
  * @param {Object.<string, Array.<string>>} filter Elements that should be included by dimension. Missing dimensions are not filtered.
  * @param {boolean} [withTotals=false] Include an additional "total" key at every level
  * @return {Object|number} An nested object which contain total value in each dimensionElement.
  *
  * @example
  * var c = new Cube(...);
  * 
  * c.query();
  * // 178
  * 
  * c.query(['year']);
  * // {2013: 25, 2014: 63, 2015: 90}
  * 
  * c.query(['year', 'location']);
  * // {2013: {shopA: 10, shopB: 20}, 2014: {shopA: 30, shopB: 15}, 2015: {shopA: 43, shopB: 60}}
  * 
  * c.query(['year', 'location'], {year: ['2013', '2014']}, true);
  * // {2013: {shopA: 10, shopB: 20, _total: 30}, 2014: {shopA: 30, shopB: 15, _total: 45}, _total: 75}
  */


	_createClass(Cube, [{
		key: "query",
		value: function query(dimensionIds, filter, withTotals) {
			// End condition
			if (dimensionIds.length == 0) return this._query_total(filter);

			var dimensionId = dimensionIds.shift();

			// search dimension
			var dimension = this._dimensionsById[dimensionId] || this._dimensionGroupsById[dimensionId];

			// Build tree
			var result = {};
			var numDimensionItems = dimension.items.length;
			var contributions = 0;
			for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
				var dimensionItem = dimension.items[dimensionItemId];

				// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
				var oldFilter = filter[dimensionId];
				if (!oldFilter || oldFilter.indexOf(dimensionItem) !== -1) filter[dimensionId] = [dimensionItem];else
					// Either lines do the same. Continuing is a bit faster.
					// filter[dimensionId] = [];
					continue;

				// Compute branch of the result tree.
				result[dimensionItem] = this.query(dimensionIds, filter);

				// Remove if empty
				if (result[dimensionItem] === undefined) delete result[dimensionItem];else ++contributions;

				// Restore filter to its former value
				if (oldFilter === undefined) delete filter[dimensionId];else filter[dimensionId] = oldFilter;
			}

			if (withTotals) result._total = this.query(dimensionIds, filter);

			dimensionIds.unshift(dimensionId);

			return contributions ? result : undefined;
		}

		/**
   * Retrieve the total value matching a given filter. 
   * 
   * @private
   * @param {Object.<string, Array.<string>>} filter Elements that should be included by dimension. Missing dimensions are not filtered.
   * @return {number} total value matching the provided filter.
   * 
   * @example
   * let cube = Cube.fromSerialization(...);
   * let result = cube._query_total({year: ['2014'], "bc4b0c3f-ee9d-4507-87ad-6eaea9102cd9": ["2d31a636-1739-4b77-98a5-bf9b7a080626"]})
   * result // 2321
   */

	}, {
		key: "_query_total",
		value: function _query_total(filter) {
			// rewrite the filter so that it contains only dimensions.
			filter = this._remove_dimension_groups(filter);
			filter = this._rewrite_as_indexes(filter);
			try {
				return this._query_rec(filter, 0);
			} catch (e) {
				return e.message;
			}
		}

		/**
   * Retrieve the total value matching given indexes and read offset.
   * 
   * @private
   * @todo Would be faster to use push/pop instead of shift/unshift into the indexes.
   * 
   * @param  {Array.<Array.<number>>} allIndexes Indexes to explore by partition.
   * @param  {number} [offset=0] Offset when reading from the data (used to recurse).
   * @return {number|undefined} Total value extracted from the cube.
   *
   * @example
   * var c = new Cube('sells', [time, location], [], [0, 1, 2, 3, 4, 5, 6]);
   * c._query_rec([], 0); // 0
   * c._query_rec([], 2); // 2
   *
   * c._query_rec([[1, 2]], 0); // 3
   * c._query_rec([[0], [0]], 5); // 5
   */

	}, {
		key: "_query_rec",
		value: function _query_rec(allIndexes, offset) {
			if (allIndexes.length == 0) return this._data[offset] == -2147483648 ? undefined : this._data[offset];

			var dimension = this._dimensions[this._dimensions.length - allIndexes.length],
			    indexes = allIndexes.shift(),
			    numIndexes = indexes.length;

			var result,
			    tmp,
			    contributions = 0;

			// Compute offset at this level.
			offset *= dimension.items.length;

			// Aggregate
			if (dimension.aggregation == 'sum') {
				result = 0;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined) {
						++contributions;
						result += tmp;
					}
				}
			} else if (dimension.aggregation == 'average') {
				result = 0;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined) {
						++contributions;
						result += tmp;
					}
				}
				result /= contributions;
			} else if (dimension.aggregation == 'highest') {
				result = -Number.MAX_VALUE;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined && tmp > result) {
						++contributions;
						result = tmp;
					}
				}
			} else if (dimension.aggregation == 'lowest') {
				result = Number.MAX_VALUE;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined && tmp < result) {
						++contributions;
						result = tmp;
					}
				}
			} else if (dimension.aggregation == 'last') {
				for (var i = numIndexes - 1; i >= 0; --i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
						break; // first defined value is OK for us.
					}
				}
			} else if (dimension.aggregation == 'none') {
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
					}
				}

				if (contributions > 1) throw new Error('AGGREGATION_FORBIDDEN');
			} else throw new Error('INVALID_AGGREGATION_MODE');

			if (contributions == 0) result = undefined;

			allIndexes.unshift(indexes);

			return result;
		}

		/**
   * When querying the cube with _query_total(), we only support
   * using dimensions (and not dimensionGroups).
   * 
   * This rewrites any filter so that they use dimensions.
   */

	}, {
		key: "_remove_dimension_groups",
		value: function _remove_dimension_groups(oldFilters) {
			var newFilters = {};

			for (var dimensionId in oldFilters) {
				var dimension = this._dimensionsById[dimensionId],
				    oldFilter = oldFilters[dimensionId];

				// if the dimension exists, we have nothing to do.
				if (dimension) {
					// Insersect our new filter with the existing one.
					if (!newFilters[dimension.id]) newFilters[dimension.id] = oldFilter;else newFilters[dimension.id] = oldFilter.filter(function (e) {
						return newFilters[dimension.id].indexOf(e) !== -1;
					});
				}
				// the dimension does not exists.
				else {
						var dimensionGroup = this._dimensionGroupsById[dimensionId];

						// if it's a group, replace it.
						if (dimensionGroup) {
							// Build new filter by concatenating elements.
							var newFilter = [];
							oldFilter.forEach(function (v) {
								Array.prototype.push.apply(newFilter, dimensionGroup.mapping[v]);
							});
							newFilter.sort();

							// If there are duplicates, remove them.
							var i = newFilter.length - 2;
							while (i > 0) {
								if (newFilter[i] == newFilter[i + 1]) newFilter.splice(i, 1);
								--i;
							}

							// Insersect our new filter with the existing one.
							if (!newFilters[dimensionGroup.childDimension]) newFilters[dimensionGroup.childDimension] = newFilter;else newFilters[dimensionGroup.childDimension] = newFilter.filter(function (e) {
								return newFilters[dimensionGroup.childDimension].indexOf(e) !== -1;
							});
						}
						// if it's not a dimension nor a dimensionGroup, raise.
						else throw new Error('Invalid dimension in filter: ' + dimensionId);
					}
			}

			return newFilters;
		}
	}, {
		key: "_rewrite_as_indexes",
		value: function _rewrite_as_indexes(filter) {
			// Rewrite the filter again in the form of integers.
			// We don't want to rewrite it into the _query_rec function, because it is
			// more efficient to do it only once here, instead of many times on the rec function.
			return this._dimensions.map(function (dimension) {
				var i, result, size;

				// No filter => filter is range(0, dimension.items.length)
				if (!filter[dimension.id]) {
					size = dimension.items.length;
					result = new Int32Array(size);
					for (i = 0; i < size; ++i) {
						result[i] = i;
					}
				}
				// Yes filter => map strings to ids in the real query.
				else {
						// Now we need to map our list of strings to indexes.
						size = filter[dimension.id].length;
						result = new Int32Array(size);
						for (i = 0; i < size; ++i) {
							result[i] = dimension.items.indexOf(filter[dimension.id][i]);
							if (result[i] === -1) throw new Error('Dimension item "' + filter[dimension.id][i] + '" was not found.');
						}
					}

				return result;
			});
		}
	}, {
		key: "serialize",
		value: function serialize() {
			return {
				id: this._id,
				dimensions: this._dimensions,
				dimensionGroups: this._dimensionGroups,
				data: this._data
			};
		}
	}]);

	return Cube;
}(AbstractCube);

/**
 * A cube collection is a container that contains all cubes from the variables of a given project
 * 
 * If there is a need to implement queries across multiple cubes, it can be implemented here.
 */


var CubeCollection = exports.CubeCollection = function (_AbstractCube2) {
	_inherits(CubeCollection, _AbstractCube2);

	function CubeCollection(id, cubes) {
		_classCallCheck(this, CubeCollection);

		var _this2 = _possibleConstructorReturn(this, (CubeCollection.__proto__ || Object.getPrototypeOf(CubeCollection)).call(this, id));

		_this2._cubes = cubes;
		return _this2;
	}

	_createClass(CubeCollection, [{
		key: "serialize",
		value: function serialize() {
			return this._cubes.map(function (cube) {
				return cube.serialize();
			});
		}
	}]);

	return CubeCollection;
}(AbstractCube);

},{"./dimension":3,"./dimension-group":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _timeSlot = require("./time-slot");

var _timeSlot2 = _interopRequireDefault(_timeSlot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * A DimensionGroup allows to query cubes on dimension aggregates.
 * For instance, for a cube containing a "date" dimension, then a "month" dimension group can be created.
 */
var DimensionGroup = function () {
	_createClass(DimensionGroup, null, [{
		key: "createTime",
		value: function createTime(parent, dimension) {
			// Create DimensionGroup mapping from Dimension items.
			var mapping = {};

			dimension.items.forEach(function (childValue) {
				var parentValue = new _timeSlot2.default(childValue).toUpperSlot(parent).value;

				mapping[parentValue] = mapping[parentValue] || [];
				mapping[parentValue].push(childValue);
			});

			return new DimensionGroup(parent, dimension.id, mapping);
		}
	}]);

	function DimensionGroup(id, childDimension, mapping) {
		_classCallCheck(this, DimensionGroup);

		this.id = id;
		this.childDimension = childDimension;
		this.items = Object.keys(mapping);
		this.mapping = mapping;
	}

	return DimensionGroup;
}();

exports.default = DimensionGroup;

},{"./time-slot":5}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dimension =

/**
 * id = "month"
 * items = ["2010-01", "2010-02", ...]
 * aggregation = "sum"
 */
function Dimension(id, items, aggregation) {
	_classCallCheck(this, Dimension);

	this.id = id;
	this.items = items;
	this.aggregation = aggregation;
};

exports.default = Dimension;

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeSlot = exports.DimensionGroup = exports.Dimension = exports.CubeCollection = exports.Cube = undefined;

var _cube = require("./cube");

var _dimension = require("./dimension");

var _dimension2 = _interopRequireDefault(_dimension);

var _dimensionGroup = require("./dimension-group");

var _dimensionGroup2 = _interopRequireDefault(_dimensionGroup);

var _timeSlot = require("./time-slot");

var _timeSlot2 = _interopRequireDefault(_timeSlot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Cube = _cube.Cube;
exports.CubeCollection = _cube.CubeCollection;
exports.Dimension = _dimension2.default;
exports.DimensionGroup = _dimensionGroup2.default;
exports.TimeSlot = _timeSlot2.default;

},{"./cube":1,"./dimension":3,"./dimension-group":2,"./time-slot":5}],5:[function(require,module,exports){
"use strict";

/**
 * A class representing a time slot used in monitoring.
 * This can be a given day, epidemiological week, month, quarter, ...
 */

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TimeSlot = function () {
	_createClass(TimeSlot, null, [{
		key: 'fromDate',


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
		value: function fromDate(utcDate, periodicity) {
			if (periodicity === 'day') return new TimeSlot(utcDate.toISOString().substring(0, 10));else if (periodicity === 'week_sat' || periodicity === 'week_sun' || periodicity === 'week_mon') {
				// Good epoch to count week is the first inferior to searched date (among next, current and last year, in that order).
				var year = utcDate.getUTCFullYear() + 1,
				    epoch = TimeSlot._getEpidemiologicWeekEpoch(year, periodicity);

				while (utcDate.getTime() < epoch.getTime()) {
					epoch = TimeSlot._getEpidemiologicWeekEpoch(--year, periodicity);
				}var weekNumber = Math.floor((utcDate.getTime() - epoch.getTime()) / 1000 / 60 / 60 / 24 / 7) + 1;
				if (weekNumber < 10) weekNumber = '0' + weekNumber;

				return new TimeSlot(year + '-W' + weekNumber + '-' + periodicity.substr(-3));
			} else if (periodicity === 'month') return new TimeSlot(utcDate.toISOString().substring(0, 7));else if (periodicity === 'quarter') return new TimeSlot(utcDate.getUTCFullYear().toString() + '-Q' + (1 + Math.floor(utcDate.getUTCMonth() / 3)).toString());else if (periodicity === 'semester') return new TimeSlot(utcDate.getUTCFullYear().toString() + '-S' + (1 + Math.floor(utcDate.getUTCMonth() / 6)).toString());else if (periodicity === 'year') return new TimeSlot(utcDate.getUTCFullYear().toString());else throw new Error("Invalid periodicity");
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

	}, {
		key: '_getEpidemiologicWeekEpoch',
		value: function _getEpidemiologicWeekEpoch(year, periodicity) {
			var SUNDAY = 0,
			    MONDAY = 1,
			    TUESDAY = 2,
			    WEDNESDAY = 3,
			    THURSDAY = 4,
			    FRIDAY = 5,
			    SATURDAY = 6;
			var firstDay = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).getUTCDay();
			var epoch = null;

			if (periodicity === 'week_sun') {
				if (firstDay === SUNDAY)
					// Lucky us, first day of year is Sunday
					epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);else if (firstDay === MONDAY)
					// Epidemiologic week started last day of december
					epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);else if (firstDay === TUESDAY)
					// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
					epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);else if (firstDay === WEDNESDAY)
					// 3 days in december, 4 in january
					epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);else if (firstDay === THURSDAY)
					// we can't have 4 days in december, so the epoch is the 4th of january (the first sunday of the year)
					epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);else if (firstDay === FRIDAY)
					// same as before: first sunday of the year
					epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);else if (firstDay === SATURDAY)
					// same as before: first sunday of the year
					epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
			} else if (periodicity === 'week_sat') {
				if (firstDay === SATURDAY)
					// Lucky us, first day of year is Saturday
					epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);else if (firstDay === SUNDAY)
					// Epidemiologic week started last day of december
					epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);else if (firstDay === MONDAY)
					// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
					epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);else if (firstDay === TUESDAY)
					// 3 days in december, 4 in january
					epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);else if (firstDay === WEDNESDAY)
					// we can't have 4 days in december, so the epoch is the 4th of january (the first saturday of the year)
					epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);else if (firstDay === THURSDAY)
					// same as before: first saturday of the year
					epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);else if (firstDay === FRIDAY)
					// same as before: first saturday of the year
					epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
			} else if (periodicity === 'week_mon') {
				if (firstDay === MONDAY)
					// Lucky us, first day of year is Sunday
					epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);else if (firstDay === TUESDAY)
					// Epidemiologic week started last day of december
					epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);else if (firstDay === WEDNESDAY)
					// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
					epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);else if (firstDay === THURSDAY)
					// 3 days in december, 4 in january
					epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);else if (firstDay === FRIDAY)
					// we can't have 4 days in december, so the epoch is the 4th of january (the first monday of the year)
					epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);else if (firstDay === SATURDAY)
					// same as before: first monday of the year
					epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);else if (firstDay === SUNDAY)
					// same as before: first monday of the year
					epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
			} else throw new Error("Invalid day");

			return new Date(epoch);
		}
	}]);

	/**
  * Constructs a TimeSlot instance from a time slot value.
  * The periodicity will be automatically computed.
  * 
  * @param  {string} value A valid TimeSlot value (those can be found calling the `value` getter).
  */
	function TimeSlot(value) {
		_classCallCheck(this, TimeSlot);

		this._value = value;
	}

	/**
  * The value of the TimeSlot.
  * This is a string that uniquely identifies this timeslot.
  * 
  * For instance: `2010`, `2010-Q1`, `2010-W07-sat`.
  * @type {string}
  */


	_createClass(TimeSlot, [{
		key: 'toUpperSlot',


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
		value: function toUpperSlot(newPeriodicity) {
			// Raise when we make invalid conversions
			if (TimeSlot._upperSlots[this.periodicity].indexOf(newPeriodicity) === -1) throw new Error('Cannot convert ' + this.periodicity + ' to ' + newPeriodicity);

			// For days, months, quarters, semesters, we can assume that getting the slot from any date works
			var upperSlotDate = this.firstDate;

			// if it's a week, we need to be a bit more cautious.
			// the month/quarter/year is not that of the first or last day, but that of the middle day of the week
			// (which depend on the kind of week, but adding 3 days to the beginning gives the good date).
			if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') upperSlotDate = new Date(upperSlotDate.getTime() + 3 * 24 * 60 * 60 * 1000);

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

	}, {
		key: 'next',
		value: function next() {
			var date = this.lastDate;
			date.setUTCDate(date.getUTCDate() + 1);
			return TimeSlot.fromDate(date, this.periodicity);
		}
	}, {
		key: 'value',
		get: function get() {
			return this._value;
		}

		/**
   * The periodicity used for this timeslot.
   * By periodicity, we mean, the method that was used to cut time into slots.
   *
   * For instance: `year`, `quarter`, `week-sat`, ...
   * @type {string}
   */

	}, {
		key: 'periodicity',
		get: function get() {
			if (!this._periodicity) {
				if (this.value.match(/^\d{4}$/)) this._periodicity = 'year';else if (this.value.match(/^\d{4}\-S\d$/)) this._periodicity = 'semester';else if (this.value.match(/^\d{4}\-Q\d$/)) this._periodicity = 'quarter';else if (this.value.match(/^\d{4}\-\d{2}$/)) this._periodicity = 'month';else if (this.value.match(/^\d{4}\-W\d{2}-sat$/)) this._periodicity = 'week_sat';else if (this.value.match(/^\d{4}\-W\d{2}-sun$/)) this._periodicity = 'week_sun';else if (this.value.match(/^\d{4}\-W\d{2}-mon$/)) this._periodicity = 'week_mon';else if (this.value.match(/^\d{4}\-\d{2}\-\d{2}$/)) this._periodicity = 'day';
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

	}, {
		key: 'firstDate',
		get: function get() {
			if (this.periodicity === 'day') return new Date(this.value + 'T00:00:00Z');else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') return new Date(TimeSlot._getEpidemiologicWeekEpoch(this.value.substring(0, 4), this.periodicity).getTime() + (this.value.substring(6, 8) - 1) * 7 * 24 * 60 * 60 * 1000 // week numbering starts with 1
			);else if (this.periodicity === 'month') return new Date(this.value + '-01T00:00:00Z');else if (this.periodicity === 'quarter') {
				var month = (this.value.substring(6, 7) - 1) * 3 + 1;
				if (month < 10) month = '0' + month;

				return new Date(this.value.substring(0, 5) + month + '-01T00:00:00Z');
			} else if (this.periodicity === 'semester') {
				var month2 = (this.value.substring(6, 7) - 1) * 6 + 1;
				if (month2 < 10) month2 = '0' + month2;

				return new Date(this.value.substring(0, 5) + month2 + '-01T00:00:00Z');
			} else if (this.periodicity === 'year') return new Date(this.value + '-01-01T00:00:00Z');
		}

		/**
   * The date where this instance of TimeSlot ends.
   * 
   * @type {Date}
   * @example
   * var t = new TimeSlot('2012-01');
   * t.firstDate.toUTCString(); // 2012-01-31T00:00:00Z
   */

	}, {
		key: 'lastDate',
		get: function get() {
			if (this.periodicity === 'day')
				// last day is current day
				return this.firstDate;else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') {
				// last day is last day of the week according to epoch
				return new Date(this.firstDate.getTime() + 6 * 24 * 60 * 60 * 1000);
			} else if (this.periodicity === 'month') {
				var monthDate = this.firstDate;
				monthDate.setUTCMonth(monthDate.getUTCMonth() + 1); // add one month.
				monthDate.setUTCDate(0); // go to last day of previous month.
				return monthDate;
			} else if (this.periodicity === 'quarter') {
				var quarterDate = this.firstDate;
				quarterDate.setUTCMonth(quarterDate.getUTCMonth() + 3); // add three month.
				quarterDate.setUTCDate(0); // go to last day of previous month.
				return quarterDate;
			} else if (this.periodicity === 'semester') {
				var semesterDate = this.firstDate;
				semesterDate.setUTCMonth(semesterDate.getUTCMonth() + 6); // add six month.
				semesterDate.setUTCDate(0); // go to last day of previous month.
				return semesterDate;
			} else if (this.periodicity === 'year') return new Date(this.value + '-12-31T00:00:00Z');
		}
	}]);

	return TimeSlot;
}();

exports.default = TimeSlot;
;

/**
 * Static member documenting which periodicity contains the others.
 *
 * @private
 * @type {Object}
 */
TimeSlot._upperSlots = {
	'day': ['week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'],
	'week_sat': ['month', 'quarter', 'semester', 'year'],
	'week_sun': ['month', 'quarter', 'semester', 'year'],
	'week_mon': ['month', 'quarter', 'semester', 'year'],
	'month': ['quarter', 'semester', 'year'],
	'quarter': ['semester', 'year'],
	'semester': ['year'],
	'year': []
};

},{}]},{},[4])(4)
});
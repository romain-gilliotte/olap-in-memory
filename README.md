# Olap in memory

Olap in memory is a library to manipulate offline OLAP cubes.

It was written as a companion library for [monitool](https://github.com/romain-gilliotte/monitool), a full-featured monitoring platform targeted at humanitarian organizations.

It support:
- Stored and computed measures
- All OLAP operations
- Can aggregate data using different operations (sum, average, first, last, highest, lowest)
- Supports attribute graphs for dimensions

# Installation

TimeslotDAG runs in both NodeJS and the browser

```console
$ npm install olap-in-memory
```

# Rationale

Many vendors already provide solutions to implement OLAP cubes, which provide many features, and better performance on big cubes.




# Usage

```javascript
const fs = require('fs');
const { Olap } = require('olap-in-memory');

// Load cube from file
const buffer = fs.readFileSync('sales.cub')
const sales = Cube.deserialize(buffer);

// A cube contains multiple dimensions and measures
sales.dimensionIds        // ['time', 'location', 'employee']
sales.storedMeasureIds    // ['numSales', 'revenue', 'workedDays']
sales.computedMeasureIds  // ['numSalesByWorkedDay', 'revenueByWorkedDay']

// Dimensions have multiple attributes
sales.getDimension('time').attributes     // ['month', 'quarter', 'semester', 'year']
sales.getDimension('location').attributes // ['zipCode', 'city', 'country']

// Cubes are inmutable objects: all methods return a new Cube which have the same interface.
const query = sales
	.drillUp('time', 'quarter')          // Aggregate data by quarter (instead of month)
	.drillUp('location', 'city')         // Aggregate data by city (instead of zipCode)
	.dice('time', 'year', ['2010'])      // keep only year 2010
	.slice('location', 'city', 'paris')  // keep only paris, and remove this dimension

// Get different reports from the same cube.
query.project(['time']).getNestedObject('numSalesByWorkedDay')
// { '2010-Q1': 6, '2010-Q2': 8, '2010-Q3': 10, '2010-Q4': 12 }

query.project(['employee']).getNestedObject('numSalesByWorkedDay')
// { 'mike': 10, 'oscar': 26 }

query.project(['employee', 'time']).getNestedObject('sales')
// {
// 	'mike': { '2010-Q1': 1, '2010-Q2': 2, '2010-Q3': 3, '2010-Q4': 4 },
// 	'oscar': { '2010-Q1': 5, '2010-Q2': 6, '2010-Q3': 7, '2010-Q4': 8 },
// }

query.project(['time', 'employee']).getNestedObject('sales')
// {
// 	'2010-Q1': {'mike': 1, 'oscar', 5},
// 	'2010-Q2': {'mike': 2, 'oscar', 6},
// 	'2010-Q3': {'mike': 3, 'oscar', 7},
// 	'2010-Q4': {'mike': 4, 'oscar', 8}
// }
```

# Alternatives

- [jsHypercube](https://code.google.com/archive/p/js-hypercube/): Legacy project from Google Code.


# Coming next

- [ ] Add interpolation system to be able to drillDown (ie: "invent" monthly data from quarterly).

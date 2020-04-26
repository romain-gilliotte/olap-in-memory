# Olap in memory

![Test suite](https://github.com/romain-gilliotte/olap-in-memory/workflows/Test%20suite/badge.svg)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/olap-in-memory)
![NPM](https://img.shields.io/npm/l/olap-in-memory)
![npm](https://img.shields.io/npm/v/olap-in-memory)
![npm](https://img.shields.io/npm/dt/olap-in-memory)

Olap in memory is a library to manipulate OLAP cubes without relying on a database doing the heavy lifting.

It support:

-   Stored and computed measures
-   All OLAP operations (slice, dice, drill-up, drill-down, ...)
-   Different aggregation/interpolation operations
-   Dimension attribute graphs

The library avoids useless allocations, slow array methods and does all the computations on TypedArrays, so it is _reasonably_ fast.

However, it was built with small cubes in mind (under 100k cells): there are no pre-computed indexes, all data is kept in flat buffers, and most query operations have a `O(numCells)` complexity. Don't expect to build a data warehousing store from it!

Besides the documentation in this readme, many examples of usage can be found in the unit tests which cover most of the features.

# Rationale behind the project

Olap in memory was written as a companion library for [Monitool](https://github.com/romain-gilliotte/monitool), a full-featured open-source monitoring platform targeted at humanitarian organizations.

Many vendors already provide solutions to implement OLAP cubes, but monitool needed to implement an append-only store, in order to allow versioning both structure and data modifications.

This needed to have a lower level access to the cubes than provided with available products, hence "yet another olap library".

Other projects:

-   [jsHypercube](https://code.google.com/archive/p/js-hypercube/): Another offline cube system (not maintained).
-   [Data Brewery Cubes](http://cubes.databrewery.org/): Light-weight Python framework and OLAP HTTP server for easy development of reporting applications and aggregate browsing of multi-dimensionally modeled data.
-   ... PR to add yours!

# Installation

The module runs in both NodeJS and the browser.

```console
$ npm install olap-in-memory
```

# Terminology

In the documentation the following terms are used:

-   Cubes: https://en.wikipedia.org/wiki/Online_analytical_processing
-   Dimension and attributes: https://en.wikipedia.org/wiki/Dimension_(data_warehouse)#Dimension_table
-   Measures: https://en.wikipedia.org/wiki/Measure_(data_warehouse)

# Table of contents

-   [Building cubes](#building-cubes)
    -   [Structure](#structure)
    -   [Filling stored measures](#filling-stored-measures)
        -   [setData, setNestedArray, setNestedObject](#setdata--setnestedarray--setnestedobject)
        -   [hydrateFromSparseNestedObject](#hydratefromsparsenestedobject)
        -   [hydrateFromCube](#hydratefromcube)
-   [Querying](#querying)
    -   [Slice](#slice)
    -   [Dicing](#dicing)
    -   [Drill-up](#drill-up)
    -   [Drill-down](#drill-down)
-   [Formatting](#formatting)
    -   [getData / getStatus](#getdata---getstatus)

# Building cubes

Building a cube from scratch is done in three steps: creating the dimensions, then the measures, and lastly hydrating the cube with data.

```javascript
const { TimeDimension, GenericDimension, Cube } = require('olap-in-memory');

// Create dimensions
const time = new TimeDimension('time', 'day', '2010-01', '2019-12');
const location = new GenericDimension('location', 'city', ['paris', 'madrid']);

// Create cube
const cube = new Cube([time, location]);
cube.createStoredMeasure('my_measure'); // add stored measure
cube.createComputedMeasure('other_measure', 'my_measure * 12'); // add computed measure
cube.setData('my_measure', [1, 2, 3, 4, 5, 6, ...]); // Load data

// Print some stats
cube.getDimension('time').numItems; // => 3652 items
cube.getDimension('location').numItems; // => 2 items
cube.storeSize; // 7344 cells
cube.byteLength; // ~ 35KiB (4 + 1 bytes / cell)
```

Before going further, be warned as of today the only implemented storage keeps all data in a contiguous TypedArray in memory which is instanciated when the measures are created.

CPU and memory usage will grow _exponentially_ with the number of dimensions. This was efficient enough for our indended usage, it might not be for yours!

```javascript
const { GenericDimension, Cube } = require('olap-in-memory');

const univacCube = new Cube([
    new GenericDimension('dim0', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim1', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim2', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim3', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim4', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim5', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim6', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim7', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim8', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
    new GenericDimension('dim9', 'root', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']),
]);

univacCube.storeSize; // 10.000.000.000 cells
univacCube.byteLength; // ~ 46.56GiB
```

## Structure

### Dimensions

Two kinds of dimensions are implemented: `TimeDimension` and `GenericDimension`.

Specific uses will benefit from implementing new dimension types by extending the `AbstractDimension` class, instead of abusing the `GenericDimension` class.

Because they enable writing formatters in order to display cubes (i.e. React/Angular components, D3js visualizations, ...), a handful of `Dimension` methods are part of the public API of `olap-in-memory`.

Those are:

-   `rootAttribute`: Current attribute which is selected on the dimension
-   `attributes`: List of available attributes which can be used to drill-up the containing cube
-   `numItems`: Number of items in the dimension (for the rootAttribute)
-   `getItems(attribute)`: List of items for given attribute
-   `getEntries(attribute)`: List of items, and associated human readable keys for given attribute.

All dimensions provide a virtual attribute `all` which contains all defined items.

#### Time dimensions

Time dimensions are meant to represent slices of times.

The implementation is powered by the [timeslot-dag](https://github.com/romain-gilliotte/timeslot-dag) date library (built on purpose for this package). Documentation is available in the linked repository / npm package.

French, Spanish and English locales are supported by the underlying library, but more can be added with PRs on timeslot-dag.

As it was needed to localize epidemiological weeks, quarters, and so on, it was not possible to simply use one of the many existing javascript date libraries which already provide translations in most languages.

```javascript
const { TimeDimension } = require('olap-in-memory');

// The constructor accepts any value which is valid with timeslot-dag
new TimeDimension('time', 'month', '2010-01', '2010-12'); // OK
new TimeDimension('time', 'month', '2010-01-14', '2010-12-07'); // OK
new TimeDimension('time', 'month', '2010', '2020'); // OK
new TimeDimension('time', 'month', '2010-01-01T00:00:00Z', '2010-12-03T00:00:00Z'); // not OK

// Let's create a dimension
const time = new TimeDimension('time', 'month', '2010-01', '2010-12');

time.rootAttribute; // => 'month'
time.attributes; // => ['month', 'quarter', 'semester', 'year', 'all']
time.getItems(); // => ['2010-01', '2010-02', '2010-03', ...]
time.getItems('quarter'); // => ['2010-Q1', '2010-Q2', ...]
time.getItems('year'); // ['2010']
time.getEntries('month', 'fr');
// [
//    ['2010-01', 'Janvier 2010'],
//    ['2010-02', 'Février 2010'],
//    ...
// ]
```

#### Generic dimensions

Generic dimensions can be used to represent any kind of needed desagregation.

They are more flexible than time dimensions, but less convenient as they require to explicitly list all attributes and dependencies between them.

Getting human strings is supported, but needs them to be provided in the `constructor()`
and with each call to `.addAttribute()`. Locales are _not_ supported.

When no human strings are provided, by default, the item will be returned instead.

```javascript
const { GenericDimension } = require('olap-in-memory');

// Mandatory constructor parameters: dimensionId, rootAttribute, items
const codes = ['fr75013', 'fr75015', 'fr75018', 'fr54000', 'fr13000', 'es28000'];
const location = new GenericDimension('location', 'postalCode', codes);

// Other attributes can be added, using a function to perform the mapping.
location.addAttribute('postalCode', 'city', postalCode => {
    if (postalCode.startsWith('fr75')) return 'paris';
    else if (postalCode.startsWith('fr54')) return 'nancy';
    else if (postalCode.startsWith('fr13')) return 'marseilles';
    else if (postalCode.startsWith('es28')) return 'madrid';
    else return 'other';
});

// Attribute can depend on each other. This time the mapping is provided with a POJO.
location.addAttribute('city', 'country', {
    paris: 'france',
    nancy: 'france',
    marseilles: 'france',
    madrid: 'spain',
    other: 'unknown',
});

location.rootAttribute; // => 'postalCode'
location.attributes; // => ['postalCode', 'city', 'country', 'all']
location.getItems(); // => ['fr75013', 'fr75015', 'fr75018', 'fr54000', 'fr13000', 'es28000']
location.getItems('country'); // ['france', 'spain', 'unknown']
location.getEntries('country'); // [['france', 'france'], ...]
```

### Measures

#### Stored measures

Stored measures are responsible for holding the data which is contained in cube.

When adding a new measure to a cube, optional parameters can be provided:

-   By dimensions aggregation rule. This will tell the cube which operations need to be applied when drilling-up. Possible values are: `sum`, `average`, `first`, `last`, `highest`, `lowest`. It defaults to `sum` on all dimensions.
-   A storage type, which can be `float32`, `float64`, `int32` and `uint32`.
-   A default value which will be used to initialize the cube, and which defaults to `NaN`.

```javascript
const cube = new Cube([...]);

// Create measure using default values
cube.createStoredMeasure('man_months');

// More arguments can be provided.
cube.createStoredMeasure(
    'sales_dollar_amount',
    { time: 'average', location: 'sum' }, // Aggregation rules used to drillup/down
    'float64', // type used to store data
    NaN // default value
);
```

It should be noted that if a default value other than `NaN` is provided, the whole cube data will be marked as initialized. It won't be possible to track which values were filled with `set*` and `hydrate*` methods anymore.

#### Computed measures

Computed measures are computed from other measures on the same cube. They are never stored, and are computed when formatting functions are called.

They are powered by the [expr-eval](https://github.com/silentmatt/expr-eval) javascript library. Refer to the linked documentation for allowed operations.

Formulas are sanitized, and `expr-eval` is configured to disallow methods which could lead to remote code execution vulnerabilities (assignments, ...), so it _should_ be safe to run formulas entered by users on a server, but no serious security audit was performed.

Use [isolated-vm](https://www.npmjs.com/package/isolated-vm) or if you need to be on the safe-side.

```javascript
const cube = new Cube([...]);

// Stored measures
cube.createStoredMeasure('sales_dollar_amount');
cube.createStoredMeasure('man_months');

// This measure will be computed from the others.
cube.createComputedMeasure('sales_by_manmonths', 'sales_dollar_amount / man_months');
```

## Filling stored measures

When a cube is created, memory is allocated, but if no default value is provided it will be empty of any data.

Multiple ways are available to hydrate them. Let's create a simple cube with six cells to demonstrate them:

```javascript
const cube = new Cube([
    new GenericDimension('location', 'city', ['paris', 'rome', 'madrid']),
    new GenericDimension('period', 'season', ['summer', 'winter']),
]);

cube.createStoredMeasure('my_measure');
```

### setData, setNestedArray, setNestedObject

The simpler method is to provide all data at once if available.
This can be done using flat arrays, nested arrays or nested objects.

```javascript
// The right format must be respected. Partial filling is not allowed.
cube.setData('my_measure', [1, 2, 3, 4, 5, 6, 7, 8, 9]); // throws Error('value length is invalid')

// Those three calls are all equivalent
cube.setData('my_measure', [1, 2, 3, 4, 5, 6]); // OK
cube.setNestedArray('my_measure', [
    [1, 2],
    [3, 4],
    [5, 6],
]);

cube.setNestedObject('my_measure', {
    paris: { summer: 1, winter: 2 },
    rome: { summer: 3, winter: 4 },
    madrid: { summer: 5, winter: 6 },
});
```

### hydrateFromSparseNestedObject

If only a subset of the data is available, `hydrateFromSparseNestedObject()` performs the same job than `.setNestedObject()`, but allows partially filling the cube.

```javascript
cube.hydrateFromSparseNestedObject('my_measure', {
    rome: { winter: 4 },
    madrid: { summer: 5 },
});

// Call it many times, it won't overwrite the previous data
cube.hydrateFromSparseNestedObject('my_measure', {
    paris: { summer: 1, winter: 2 },
    madrid: { winter: 6 },
});
```

### hydrateFromCube

Allows taking the data from a cube, and copying it into another cube.

This method will try as much as possible to aggregate, interpolate or filter the input cube data to have it fit into the cube which is being filled.

```javascript
// 'inputCube' dimensions match 'cube' definition.
const inputCube = new Cube([
    new GenericDimension('location', 'city', ['madrid']),
    new GenericDimension('time', 'season', ['winter']),
]);

inputCube.createStoredMeasure('my_measure');
inputCube.setData('my_measure', [22]);

cube.hydrateFromCube(inputCube);
cube.getData('main_measure');
// => [NaN, NaN, NaN, NaN, NaN, 22]

// Let's try with another cube which lacks the time dimension
const inputCube2 = new Cube([new GenericDimension('location', 'city', ['paris'])]);
inputCube2.createStoredMeasure('my_measure');
inputCube2.setData('my_measure', [66]);

cube.hydrateFromCube(inputCube2);
cube.getData('main_measure');
// Data is interpolated and no error is thrown.
// Take care, this behaviour can lead to unexpected results!
// => [33, 33, NaN, NaN, NaN, 22]
```

# Querying

Unlike `set` and `hydrate` methods, cubes can be considered as inmutable objects for all query methods.

All calls return a new Cube leaving the original cube unchanged and are chainable.

Do not use "no-op queries" to clone a cube (like dicing with a range which contains the whole cube). In those cases a new instance won't be created, and the query method will `return this`.

```javascript
const fs = require('fs');
const { Cube } = require('olap-in-memory');

// Load cube from file
const buffer = fs.readFileSync('sales.cub');
const sales = Cube.deserialize(buffer);

// Query cube
const sales_paris2010 = sales
    .drillUp('time', 'quarter') // Aggregate time by quarter
    .dice('time', 'year', ['2010']) // Keep only 2010, keeping the details by quarter
    .slice('location', 'city', 'paris'); // Keep only paris, and remove the dimension
    .project(['time']) // project on time dimension

// Render result
sales_paris2010.getData('sales_by_workday')
// => [6, 8, 10, 12]

sales_paris2010.getNestedObject('sales_by_workday')
// => { '2010-Q1': 6, '2010-Q2': 8, '2010-Q3': 10, '2010-Q4': 12 }
```

### Slicing

As the name indicate, takes a slice of the provided cube.

```javascript
const cube = Cube.deserialize(...);

cube.getNestedObjet('main_measure');
// => {
//    '2010-Q1': { 'paris': 23, 'rome': 56, 'madrid': 43},
//    '2010-Q2': { 'paris': 43, 'rome': 67, 'madrid': 23},
//    ...
// }

cube.slice('location', 'city', 'paris').getNestedObject('main_measure');
// => { '2010-Q1': 23, '2010-Q2': 43, ... }

cube.slice('time', 'quarter', '2010-Q2').getNestedObject('main_measure');
// => { 'paris': 43, 'rome': 67, 'madrid': 23}
```

All dimensions have a virtual attribute which allows aggregating all items.

```javascript
const cube = Cube.deserialize(...);

cube.slice('time', 'all', 'all').getNestedObject('main_measure');
// => { 'paris': 344, 'rome': 233, 'madrid': 344}
```

When slicing, the dimension is removed from the new cube, so calls cannot be chained on the same dimension.

```javascript
const cube = Cube.deserialize(...);

cube.slice('location', 'city', 'paris') // OK
    .slice('time', 'quarter', '2010-Q2') // OK
    .slice('location', 'city', 'madrid'); // throws Error('No such dimension: location')
```

### Dicing

Filter the cube data on a given dimension

```javascript
const cube = Cube.deserialize(...);

cube.getNestedObjet('main_measure');
// => {
//   '2010-Q1': { 'paris': 23, 'rome': 56, 'madrid': 43},
//   '2010-Q2': { 'paris': 43, 'rome': 67, 'madrid': 23},
//   ...
// }

cube.dice('location', 'city', ['paris', 'madrid']).getNestedObject('main_measure');
// => {
//    '2010-Q1': { 'paris': 23, 'madrid': 43},
//    '2010-Q2': { 'paris': 43, 'madrid': 23},
//    ...
// }
```

Sometimes, it is inconvenient, or memory intensive to provide all items to dice a cube. Using any attribute that the underlying dimension supports or ranges makes things easier.

```javascript
const cube = Cube.deserialize(...);

// Those calls are equivalent
const cube1 = cube.dice('time', 'quarter', ['2010-Q1', '2010-Q2', '2010-Q3', '2010-Q4']);
const cube2 = cube.dice('time', 'year', ['2010']);
const cube3 = cube.diceRange('time', 'day', '2010-01-01', '2010-12-31');
const cube4 = cube.diceRange('time', 'quarter', '2010-Q1', '2010-Q4');
const cube5 = cube.diceRange('time', 'year', '2010', '2010');

isDeepEqual(cube1, cube2, cube3, cube4, cube5); // => true
```

Unlike slice operations, dices can be chained on any given dimension

```javascript
const cube = Cube.deserialize(...);

cube.dice('location', ['paris', 'madrid']) // OK
    .dice('location', ['madrid']) // OK
    .dice('location', ['doesnotexists']); // OK, dicing on non existent items is a no-op
```

An optional third argument allows reordering the associated dimensions items in the new sub-cube (defaults to `false`).

```javascript
const cube = Cube.deserialize(...);

cube.dice('location', ['madrid', 'paris'], true).getNestedObject('main_measure');
// => {
//    '2010-Q1': { 'madrid': 43, 'paris': 23},
//    '2010-Q2': { 'madrid': 23, 'paris': 43},
//    ...
// }
```

### Drilling-up

Drilling up a cube allows aggregating it's data on any given dimension.
, '2010-Q1', '2010-Q4'

```javascript
const cube = Cube.deserialize(...);
cube.getNestedObject('main_measure');
// { '2010-01': 14, '2010-02': 32, '2010-03': 21, '2010-04': 13}

cube.drillUp('time', 'quarter').getNestedObject('main_measure');
// { '2010-Q1': 67, '2010-Q2': 13}
```

### Drilling-down

Drilling down a cube _interpolates_ it's data on the chosen dimension.

```javascript
const cube = Cube.deserialize(...);
cube.getNestedObject('float_measure');
// { '2010-Q1': 67, '2010-Q2': 14}

cube.drillDown('time', 'month').getNestedObject('float_measure');
// {
//    '2010-01': 22.3333, '2010-02': 22.3333, '2010-03': 22.3333,
//    '2010-04': 4.6666, '2010-05': 4.6666, '2010-06': 4.6666
// }
```

When using non-default `uint32` or `int32` storage for the considered measure, rounding
will be applied to redistribute the error and make sure that the same data is recovered when
drilling the cube back up.

```javascript
const cube = Cube.deserialize(...);
cube.getNestedObject('int_measure');
// { '2010-Q1': 67, '2010-Q2': 14}

cube.drillDown('time', 'month').getNestedObject('int_measure');
// {
//    '2010-01': 23, '2010-02': 22, '2010-03': 22,
//    '2010-04': 5, '2010-05': 5, '2010-06': 4
// }
```

Drilling-down and back up give back the original data within rounding errors.
The opposite will **not** work.

```javascript
const cube = Cube.deserialize(...);
const downThenUp = cube.drillDown('time', 'month').drillUp('time', 'quarter');
const upThenDown = cube.drillUp('time', 'semester').drillDown('time', 'quarter');

isDeepEqual(original, downThenUp);
// => always true with 'int*' storage
// => almost true for 'float*' storage (i.e. floating points rounding errors).

isDeepEqual(original, upThenDown);
// => false
```

### Reordering dimensions

This can be used to change the output of the formatters, but have no other consequences.

```javascript
const cube = Cube.deserialize(...);
cube.dimensionIds;
// => ['time', 'location']

cube.getNestedObjet('main_measure');
// => {
//    '2010-Q1': { 'paris': 23, 'rome': 56, 'madrid': 43},
//    '2010-Q2': { 'paris': 43, 'rome': 67, 'madrid': 23},
//    ...
// }

cube.reorderDimensions(['location', 'time']).getNestedObject('main_measure');
// => {
//    'paris': { '2010-Q1': 23, '2010-Q2': 43,...},
//    'rome': { '2010-Q1': 56, '2010-Q2': 67, ...},
//    'madrid': { '2010-Q1': 43, '2010-Q2': 23, ...},
//    ...
// }
```

### Adding and removing dimensions

Dimensions can be added and removed on existing cube.

Adding dimensions which have more than one item will cause, the data in all stored measures to be interpolated.

Rules about how to aggregate the defined measures on the new dimension, and index can be provided to specify where the dimension should be injected.

```javascript
const cube = Cube.deserialize(...);
cube.getNestedObject('main_mesure');
// { '2010-Q1': 66, '2010-Q2': 14}


// Add dimension
const newDim = new GenericDimension('dim', 'root', ['a', 'b'])
const cubeWithOneMoreDim = cube.addDimension(newDim, 0, { main_mesure: 'sum' })

// Data was interpolated
cubeWithOneMoreDim.getNestedObject('main_mesure');
// {
//    a: { '2010-Q1': 33, '2010-Q2': 7 } },
//    b: { '2010-Q1': 33, '2010-Q2': 7 } }
// }

// Remove the dim we added
const cubeRestored1 = cubeWithOneMoreDim.removeDimension('dim');
const cubeRestored2 = cubeWithOneMoreDim.slice('time', 'all', 'all');

isDeepEqual(cube, cubeRestored1, cubeRestored2); // => true
```

### Other convenience methods

-   `.keepDimensions([...dimensionIds])`: Keep only dimensions in the list
-   `.removeDimensions([...dimensionIds])`: Remove all dimensions in the list
-   `.project([...dimensionIds])`: keepDimensions + reorderDimensions so that dimensions in result match the provided list.

# Formatting

### getData(measureId) and getNestedArray(measureId)

Those methods simply returns a copy of the cells data, either in a flat or nested array, in the same order than provided by the dimensions.

Cube dimensions must be known before-hand, or extracted from the cube instance to make sense of the data.

```javascript
const cube = Cube.deserialize(...);

// Get dimensions entries
cube.dimensions.map(dim => dim.getEntries(null, 'en')));
[
    [['2010-01', 'January 2010'], ...],
    [['madrid', 'City of Madrid'], ...],
]

cube.getData('main_mesure');
// [1, 2, 3, 4, ...]

cube.getNestedArray('main_mesure');
// [[1, 2, 3, ...], [4, ...], ...]

```

### getStatus(measureId)

Like `getData` and in the same order, this method returns a copy of the status of all the cells within the considered cube.

Cell status are a bit-array which is maintained on all operations, and allows to keep track of:

-   which cells were interpolated at some point, and therefor cannot be trusted.
-   which cells were set.
-   which cells are incomplete (only some of the sub-cells were set when drilling-up).

When the cube is filled with the `.hydrateFromCube(otherCube)` method, the status flags are copy between cubes.

```javascript
const _ = require('lodash');

const cube = Cube.deserialize(...);

const data = cube.getData('main_mesure')
const status = cube.getStatus('main_mesure').map(status => ({
    // The bit-array contains the following flags:
    // - 0x1: Value is not set
    // - 0x2: Value was set
    // - 0x4: Value was interpolated at some point

    is_empty: (status & 0x3) == 0x1,
    is_incomplete: (status & 0x3) == 0x3,
    is_complete: (status & 0x3) == 0x2,
    is_interpolated: (status & 0x4) == 0x4
}));

_.zip(data, status)
// [
//    [ NaN, { is_empty: true, is_incomplete: false, is_complete: false, is_interpolated: false } ],
//    [ 1, { is_empty: false, is_incomplete: true, is_complete: false, is_interpolated: false } ],
//    [ 2, { is_empty: false, is_incomplete: false, is_complete: true, is_interpolated: false } ],
// ]
```

Note: There is no `getNestedStatus()` method.

### getNestedObject(measureId, withTotals = false, withMetadata = false)

Simply returns the data as a nested object, indexed with the dimension items.
This is the method we have been using on the whole documentation

```javascript
const cube = Cube.deserialize(...);

cube.getNestedObject('main_measure'); // Simple call
// {
//    paris: { '2010-Q1': 33, '2010-Q2': 7 } },
//    madrid: { '2010-Q1': 33, '2010-Q2': 7 } }
// }

cube.getNestedObject('main_measure', true); // We can ask for totals
// {
//    paris: { '2010-Q1': 33, '2010-Q2': 7, all: 40 } },
//    madrid: { '2010-Q1': 33, '2010-Q2': 7, all: 40 } },
//    all: { '2010-Q1': 66, '2010-Q2': 14, all: 80 } },
// }

cube.getNestedObject('main_measure', false, true); // We can ask for status
// {
//     paris: {
//        '2010-Q1': { v: 33, r: true, c: true },
//        '2010-Q2': { v: 7, r: true, c: true },
//     },
//     madrid: {
//        '2010-Q1': { v: 33, r: true, c: true },
//        '2010-Q2': { v: 7, r: true, c: true },
//     }
// }
```

When requesting status metadata:

-   c === complete === !(status & 0x1)
-   r === raw === not interpolated === !(status & 0x4)

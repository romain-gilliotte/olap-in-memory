
const Cube = require('../../src/cube');
const Dimension = require('../../src/dimension');

module.exports = (createMesures = true, fill = true) => {
	const period = new Dimension('period', 'season', ['summer', 'winter']);
	const location = new Dimension('location', 'city', ['paris', 'toledo', 'tokyo']);
	location.addChildAttribute('city', 'country', { 'paris': 'france', 'toledo': 'spain', 'tokyo': 'japan' });
	location.addChildAttribute('city', 'continent', { 'paris': 'europe', 'toledo': 'europe', 'tokyo': 'asia' });
	location.addChildAttribute('city', 'citySize', { 'paris': 'big', 'toledo': 'small', 'tokyo': 'big' });

	const cube = new Cube([location, period]);

	// Create measures
	if (createMesures) {
		cube.createStoredMeasure('antennas', 0);
		cube.createStoredMeasure('routers', 0);
		cube.createComputedMeasure('router_by_antennas', 'routers / antennas');
	}

	// Fill
	if (fill) {
		cube.setNestedArray('antennas', [[1, 2], [4, 8], [16, 32]]);
		cube.setNestedArray('routers', [[3, 2], [4, 9], [16, 32]]);
	}

	return cube;
};

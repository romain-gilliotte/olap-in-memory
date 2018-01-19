
import Cube from '../../src/cube';
import {Dimension, StaticDimensionItem} from '../../src/dimension';

export default (createMesures=true, fill=true) => {
	const cube = new Cube(
		[
			new Dimension(
				'city',
				[
					new StaticDimensionItem('paris', {'continent': 'europe', 'size': 'megalopolis'}),
					new StaticDimensionItem('toledo', {'continent': 'europe', 'size': 'town'}),
					new StaticDimensionItem('tokyo', {'continent': 'asia', 'size': 'megalopolis'})
				]
			),
			new Dimension(
				'season',
				[
					new StaticDimensionItem('summer'),
					new StaticDimensionItem('winter')
				]
			)
		]
	);

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

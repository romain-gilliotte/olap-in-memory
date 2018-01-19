import chai from "chai";
const assert = chai.assert;

import createTestCube from './helpers/create-test-cube';

describe('merging cubes', function() {

	let cube1, cube2;

	beforeEach(function() {
		cube1 = createTestCube(false, false);
		cube2 = createTestCube(false, false);
	});

	describe('merge', function() {

		it('should merge simple cubes', function() {

		});

	});

	describe('compose', function() {

		it('should compose simple cubes', function() {
			cube1.removeDimension('season');
			


		});

	});

});


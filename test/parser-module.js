const assert = require('chai').assert;
const getParser = require('../dist/parser');

describe('Parser Module', function () {
    let parser;

    beforeEach(function () {
        parser = getParser();
    });

    describe('parser configuration', function () {
        it('should create parser with correct options', function () {
            assert.isDefined(parser);
            assert.isFunction(parser.parse);
            assert.isFunction(parser.evaluate);
        });

        it('should have isNaN function available', function () {
            assert.isDefined(parser.functions.isNaN);
            assert.isFunction(parser.functions.isNaN);
            assert.equal(parser.functions.isNaN, Number.isNaN);
        });

        it('should have empty consts object', function () {
            assert.isDefined(parser.consts);
            assert.isObject(parser.consts);
            assert.deepEqual(parser.consts, {});
        });

        it('should have custom || operator', function () {
            assert.isDefined(parser.binaryOps['||']);
            assert.isFunction(parser.binaryOps['||']);
        });
    });

    describe('basic arithmetic operations', function () {
        it('should handle addition', function () {
            const expr = parser.parse('2 + 3');
            assert.equal(expr.evaluate(), 5);
        });

        it('should handle subtraction', function () {
            const expr = parser.parse('5 - 2');
            assert.equal(expr.evaluate(), 3);
        });

        it('should handle multiplication', function () {
            const expr = parser.parse('3 * 4');
            assert.equal(expr.evaluate(), 12);
        });

        it('should handle division', function () {
            const expr = parser.parse('8 / 2');
            assert.equal(expr.evaluate(), 4);
        });

        it('should handle complex expressions', function () {
            const expr = parser.parse('(2 + 3) * 4 - 1');
            assert.equal(expr.evaluate(), 19);
        });
    });

    describe('variable handling', function () {
        it('should evaluate expressions with variables', function () {
            const expr = parser.parse('x + y');
            const result = expr.evaluate({ x: 5, y: 3 });
            assert.equal(result, 8);
        });

        it('should handle missing variables by throwing error', function () {
            const expr = parser.parse('x + y');
            assert.throws(() => {
                expr.evaluate({ x: 5 });
            }, /undefined variable/);
        });

        it('should get variable names from expression', function () {
            const expr = parser.parse('antennas * 2 + routers');
            const variables = expr.variables();
            assert.deepEqual(variables.sort(), ['antennas', 'routers']);
        });
    });

    describe('isNaN function', function () {
        it('should identify NaN values', function () {
            const expr = parser.parse('isNaN(x)');
            assert.equal(expr.evaluate({ x: NaN }), true);
            assert.equal(expr.evaluate({ x: 5 }), false);
            assert.equal(expr.evaluate({ x: 0 }), false);
        });
    });

    describe('custom || operator', function () {
        it('should return b when a is NaN and b is not NaN', function () {
            const op = parser.binaryOps['||'];
            assert.equal(op(NaN, 5), 5);
        });

        it('should return a when a is not NaN and b is NaN', function () {
            const op = parser.binaryOps['||'];
            assert.equal(op(5, NaN), 5);
        });

        it('should return sum when both are not NaN', function () {
            const op = parser.binaryOps['||'];
            assert.equal(op(3, 4), 7);
        });

        it('should return sum when both are NaN', function () {
            const op = parser.binaryOps['||'];
            const result = op(NaN, NaN);
            assert.isNaN(result);
        });

        it('should work in parsed expressions', function () {
            const expr = parser.parse('a || b');
            assert.equal(expr.evaluate({ a: NaN, b: 5 }), 5);
            assert.equal(expr.evaluate({ a: 3, b: NaN }), 3);
            assert.equal(expr.evaluate({ a: 2, b: 3 }), 5);
        });
    });

    describe('expression manipulation', function () {
        it('should substitute variables in expressions', function () {
            const expr = parser.parse('antennas * 2');
            const substituted = expr.substitute('antennas', 'new_antennas');
            const variables = substituted.variables();
            assert.include(variables, 'new_antennas');
            assert.notInclude(variables, 'antennas');
        });

        it('should handle complex substitutions', function () {
            const expr = parser.parse('(antennas + routers) / total');
            const substituted = expr.substitute('antennas', 'antenna_count');
            const variables = substituted.variables();
            assert.include(variables, 'antenna_count');
            assert.include(variables, 'routers');
            assert.include(variables, 'total');
            assert.notInclude(variables, 'antennas');
        });
    });

    describe('edge cases', function () {
        it('should handle zero values', function () {
            const expr = parser.parse('x * 0');
            assert.equal(expr.evaluate({ x: 5 }), 0);
        });

        it('should handle negative values', function () {
            const expr = parser.parse('-x + y');
            assert.equal(expr.evaluate({ x: 3, y: 5 }), 2);
        });

        it('should handle division by zero', function () {
            const expr = parser.parse('x / 0');
            const result = expr.evaluate({ x: 5 });
            assert.equal(result, Infinity);
        });

        it('should handle very large numbers', function () {
            const expr = parser.parse('x * y');
            const result = expr.evaluate({ x: 1e10, y: 1e10 });
            assert.equal(result, 1e20);
        });
    });
});

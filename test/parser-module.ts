import { describe, it, beforeEach, expect, beforeAll } from '@jest/globals';
import getParser from '../src/parser';

describe('Parser Module', function () {
    let parser: any;

    beforeEach(function () {
        parser = getParser();
    });

    describe('parser configuration', function () {
        it('should create parser with correct options', function () {
            expect(parser).toBeDefined();
            expect(typeof parser.parse).toBe('function');
            expect(typeof parser.evaluate).toBe('function');
        });

        it('should have isNaN function available', function () {
            expect(parser.functions.isNaN).toBeDefined();
            expect(typeof parser.functions.isNaN).toBe('function');
            expect(parser.functions.isNaN).toBe(Number.isNaN);
        });

        it('should have empty consts object', function () {
            expect(parser.consts).toBeDefined();
            expect(typeof parser.consts).toBe('object');
            expect(parser.consts).toEqual({});
        });

        it('should have custom || operator', function () {
            expect(parser.binaryOps['||']).toBeDefined();
            expect(typeof parser.binaryOps['||']).toBe('function');
        });
    });

    describe('basic arithmetic operations', function () {
        it('should handle addition', function () {
            const expr = parser.parse('2 + 3');
            expect(expr.evaluate()).toBe(5);
        });

        it('should handle subtraction', function () {
            const expr = parser.parse('5 - 2');
            expect(expr.evaluate()).toBe(3);
        });

        it('should handle multiplication', function () {
            const expr = parser.parse('3 * 4');
            expect(expr.evaluate()).toBe(12);
        });

        it('should handle division', function () {
            const expr = parser.parse('8 / 2');
            expect(expr.evaluate()).toBe(4);
        });

        it('should handle complex expressions', function () {
            const expr = parser.parse('(2 + 3) * 4 - 1');
            expect(expr.evaluate()).toBe(19);
        });
    });

    describe('variable handling', function () {
        it('should evaluate expressions with variables', function () {
            const expr = parser.parse('x + y');
            const result = expr.evaluate({ x: 5, y: 3 });
            expect(result).toBe(8);
        });

        it('should handle missing variables by throwing error', function () {
            const expr = parser.parse('x + y');
            expect(() => {
                expr.evaluate({ x: 5 });
            }).toThrow(/undefined variable/);
        });

        it('should get variable names from expression', function () {
            const expr = parser.parse('antennas * 2 + routers');
            const variables = expr.variables();
            expect(variables.sort()).toEqual(['antennas', 'routers']);
        });
    });

    describe('isNaN function', function () {
        it('should identify NaN values', function () {
            const expr = parser.parse('isNaN(x)');
            expect(expr.evaluate({ x: NaN })).toBe(true);
            expect(expr.evaluate({ x: 5 })).toBe(false);
            expect(expr.evaluate({ x: 0 })).toBe(false);
        });
    });

    describe('custom || operator', function () {
        it('should return b when a is NaN and b is not NaN', function () {
            const op = parser.binaryOps['||'];
            expect(op(NaN, 5)).toBe(5);
        });

        it('should return a when a is not NaN and b is NaN', function () {
            const op = parser.binaryOps['||'];
            expect(op(5, NaN)).toBe(5);
        });

        it('should return sum when both are not NaN', function () {
            const op = parser.binaryOps['||'];
            expect(op(3, 4)).toBe(7);
        });

        it('should return sum when both are NaN', function () {
            const op = parser.binaryOps['||'];
            const result = op(NaN, NaN);
            expect(isNaN(result)).toBe(true);
        });

        it('should work in parsed expressions', function () {
            const expr = parser.parse('a || b');
            expect(expr.evaluate({ a: NaN, b: 5 })).toBe(5);
            expect(expr.evaluate({ a: 3, b: NaN })).toBe(3);
            expect(expr.evaluate({ a: 2, b: 3 })).toBe(5);
        });
    });

    describe('expression manipulation', function () {
        it('should substitute variables in expressions', function () {
            const expr = parser.parse('antennas * 2');
            const substituted = expr.substitute('antennas', 'new_antennas');
            const variables = substituted.variables();
            expect(variables).toContain('new_antennas');
            expect(variables).not.toContain('antennas');
        });

        it('should handle complex substitutions', function () {
            const expr = parser.parse('(antennas + routers) / total');
            const substituted = expr.substitute('antennas', 'antenna_count');
            const variables = substituted.variables();
            expect(variables).toContain('antenna_count');
            expect(variables).toContain('routers');
            expect(variables).toContain('total');
            expect(variables).not.toContain('antennas');
        });
    });

    describe('edge cases', function () {
        it('should handle zero values', function () {
            const expr = parser.parse('x * 0');
            expect(expr.evaluate({ x: 5 })).toBe(0);
        });

        it('should handle negative values', function () {
            const expr = parser.parse('-x + y');
            expect(expr.evaluate({ x: 2, y: 5 })).toBe(3);
        });

        it('should handle division by zero', function () {
            const expr = parser.parse('x / 0');
            const result = expr.evaluate({ x: 5 });
            expect(result).toBe(Infinity);
        });

        it('should handle very large numbers', function () {
            const expr = parser.parse('x * y');
            const result = expr.evaluate({ x: 1e10, y: 1e10 });
            expect(result).toBe(1e20);
        });
    });
});

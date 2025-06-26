import { Parser } from 'expr-eval';

function getParser(): Parser {
    const parser = new Parser({
        operators: {
            logical: false,
            comparison: false,
            in: false,
            assignment: false,
        },
    });

    parser.functions = {
        isNaN: Number.isNaN,
    };

    parser.consts = {};

    // Operators are hardcoded => we can't create new ones so we steal the concatenation operation.
    // @see https://github.com/silentmatt/expr-eval/blob/92656356d64d7b7edba1ae1a9128799b64030559/src/token-stream.js#L375
    // TypeScript doesn't know about binaryOps, but it exists at runtime
    (parser as any).binaryOps['||'] = (a: number, b: number): number => {
        if (Number.isNaN(a) && !Number.isNaN(b)) return b;
        else if (!Number.isNaN(a) && Number.isNaN(b)) return a;
        else return a + b;
    };

    return parser;
}

export = getParser;

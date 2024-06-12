import { assert } from '../utils';
import type { BencodeValue, BencodeArray, BencodeDictionary } from './types';

export function BencodeDecoder<T = BencodeValue>(
    input: Readonly<Buffer>,
): { decode: () => T } {
    let cursor = 0;

    const decode = (): T => {
        const parsedValue = parseValue() as T;

        assert(
            cursor === input.length,
            'Incorrect bencode format was provided',
        );

        return parsedValue;
    };

    const parseValue = (): BencodeValue => {
        if (isString()) {
            return parseString();
        }

        if (isInt()) {
            return parseInteger();
        }

        if (isList()) {
            return parseList();
        }

        if (isDict()) {
            return parseDictionary();
        }

        throw new Error(
            `Unexpected character: ${peek()}/${String.fromCharCode(peek())}`,
        );
    };

    const parseInteger = (): number => {
        // skips the i character
        consume();

        const endIdx = input.indexOf(101, cursor);
        assert(endIdx !== -1, 'Integer value must end with "e"');

        const bytes = input.subarray(cursor, endIdx);
        assert(bytes.length > 0, 'Expected an integer to be present');
        cursor = endIdx;

        // skips the ending letter
        consume();

        return parseInt(bytes.toString('ascii'));
    };

    const parseString = (): Buffer => {
        const endIdx = input.indexOf(58, cursor);
        assert(endIdx !== -1, 'String length must be followed by ":"');

        const byteNum = input.subarray(cursor, endIdx);
        cursor = endIdx;

        const length = parseInt(byteNum.toString('ascii'));

        assert(
            Number.isInteger(length),
            `Expected an integer for the length of a string, found ${length}, string format must be length:content`,
        );
        assert(length > 0, 'Expected length of a string to be more than 0');

        // skips the colon
        consume();

        const bytes = input.subarray(cursor, cursor + length);
        assert(
            bytes.length === length,
            `Expected string with the length of ${length}, found ${bytes.length}`,
        );
        cursor += length;

        return bytes;
    };

    const parseList = (): BencodeArray => {
        // skips the l character
        consume();

        const list: BencodeArray = [];

        while (!isEndingCharacter()) {
            list.push(parseValue());
        }

        // skips the ending letter
        consume();

        return list;
    };

    const parseDictionary = (): BencodeDictionary => {
        // skips the d character
        consume();

        const dict: BencodeDictionary = {};

        while (cursor < input.length && !isEndingCharacter()) {
            const key = parseString().toString('ascii');
            const value = parseValue();
            assert(
                value != null,
                'Value of a key in a dictionary must not be empty',
            );

            dict[key] = value;
        }

        // skips the ending letter
        consume();

        return dict;
    };

    const peek = (): number => {
        assert(
            cursor < input.length,
            `Cursor when peeking must not be more than or equal the input size, expected ${input.length - 1}, found ${cursor}`,
        );

        return input[cursor]!;
    };

    const consume = (): number => {
        const current = peek();
        cursor += 1;
        return current;
    };

    const isInt = (): boolean => {
        return peek() === 105; // i
    };

    const isList = (): boolean => {
        return peek() === 108; // l
    };

    const isDict = (): boolean => {
        return peek() === 100; // d
    };

    const isString = (): boolean => {
        return peek() >= 48 && peek() <= 57; // 0 - 9
    };

    const isEndingCharacter = (): boolean => {
        return peek() === 101; // e
    };

    return { decode };
}

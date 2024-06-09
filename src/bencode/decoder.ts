import { assert } from '../utils';

// Refactor utility functions and type for when creating encode
type BencodeArray = Array<BencodeValue>;
type BencodeString = string;
type BencodeNumber = number;
type BencodeDictionary<T = any> = {
    [K in keyof T]: T[K];
};

type BencodeValue =
    | BencodeString
    | BencodeNumber
    | BencodeArray
    | BencodeDictionary;

export class BencodeDecoder<T = BencodeValue> {
    private cursor = 0;

    constructor(
        private readonly input: Buffer,
        private readonly encoding?: BufferEncoding,
    ) {}

    public decode(): T {
        const parsedValue = this.parseValue() as T;

        assert(
            this.cursor === this.input.length,
            'Incorrect bencode format was provided',
        );

        return parsedValue;
    }

    private parseValue(): BencodeValue {
        if (this.isString()) {
            return this.parseString();
        }

        if (this.isInt()) {
            return this.parseInteger();
        }

        if (this.isList()) {
            return this.parseList();
        }

        if (this.isDict()) {
            return this.parseDictionary();
        }

        throw new Error(
            `Unexpected character: ${this.peek()}/${String.fromCharCode(this.peek())}`,
        );
    }

    private parseInteger(): BencodeNumber | Buffer {
        // skips the i character
        this.consume();

        const endIdx = this.input.indexOf('e', this.cursor);
        assert(endIdx !== -1, 'Integer value must end with "e"');

        const bytes = this.input.subarray(this.cursor, endIdx);
        assert(bytes.length > 0, 'Expected an integer to be present');
        this.cursor = endIdx;

        // skips the ending letter
        this.consume();

        return this.encoding ? parseInt(bytes.toString('utf-8')) : bytes;
    }

    private parseString(): BencodeString | Buffer {
        const endIdx = this.input.indexOf(':', this.cursor, 'utf-8');
        assert(endIdx !== -1, 'String length must be followed by ":"');

        const byteNum = this.input.subarray(this.cursor, endIdx);
        this.cursor = endIdx;

        const length = parseInt(byteNum.toString('utf-8'));

        assert(
            Number.isInteger(length),
            `Expected an integer for the length of a string, found ${length}, string format must be length:content`,
        );
        assert(length > 0, 'Expected length of a string to be more than 0');

        // skips the colon
        this.consume();

        const bytes = this.input.subarray(this.cursor, this.cursor + length);
        assert(
            bytes.length === length,
            `Expected string with the length of ${length}, found ${bytes.length}`,
        );
        this.cursor += length;

        return this.encoding ? bytes.toString(this.encoding) : bytes;
    }

    private parseList(): BencodeArray {
        // skips the l character
        this.consume();

        const list: BencodeArray = [];

        while (!this.isEndingCharacter()) {
            list.push(this.parseValue());
        }

        // skips the ending letter
        this.consume();

        return list;
    }

    private parseDictionary(): BencodeDictionary {
        // skips the d character
        this.consume();

        const dict: BencodeDictionary = {};

        while (this.cursor < this.input.length && !this.isEndingCharacter()) {
            const key = this.parseString().toString('utf-8');
            const value = this.parseValue();
            assert(
                value != null,
                'Value of a key in a dictionary must not be empty',
            );

            dict[key] = value;
        }

        // skips the ending letter
        this.consume();

        return dict;
    }

    private peek(): number {
        assert(
            this.cursor < this.input.length,
            `Cursor when peeking must not be more than or equal the input size, expected ${this.input.length - 1}, found ${this.cursor}`,
        );

        return this.input[this.cursor]!;
    }

    private consume(): number {
        const current = this.peek();
        this.cursor += 1;
        return current;
    }

    private isInt(): boolean {
        return this.peek() === 105; // i
    }

    private isList(): boolean {
        return this.peek() === 108; // l
    }

    private isDict(): boolean {
        return this.peek() === 100; // d
    }

    private isString(): boolean {
        return this.peek() >= 48 && this.peek() <= 57; // 0 - 9
    }

    private isEndingCharacter(): boolean {
        return this.peek() === 101; // e
    }
}

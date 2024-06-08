import { assert } from '../utils';

type BencodeValue =
    | string
    | number
    | Array<BencodeValue>
    | { [key: string]: BencodeValue };

export class BencodeDecoder {
    private cursor = 0;
    private input: string;

    constructor(input: Readonly<Buffer>) {
        this.input = input.toString('utf-8');
    }

    public decode(): BencodeValue {
        return this.parseValue();
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

        throw new Error(`Invalid character: ${this.peek()}`);
    }

    private parseInteger(): number {
        // skips the i character
        this.consume();

        let chars = '';

        while (!this.isEndingCharacter()) {
            chars += this.consume();
        }

        // skips the ending letter
        this.consume();

        return parseInt(chars);
    }

    private parseString(): string {
        let num = '';
        while (/\d/.test(this.peek())) {
            num += this.consume();
        }

        const length = parseInt(num);
        assert(
            Number.isInteger(length),
            `Expected an integer for the length of a string, found ${length}`,
        );
        // skips the colon
        this.consume();

        const chars = this.input.slice(this.cursor, this.cursor + length);
        this.cursor += length;

        return chars;
    }

    private parseList(): Array<BencodeValue> {
        // skips the l character
        this.consume();

        const list: BencodeValue = [];

        while (!this.isEndingCharacter()) {
            list.push(this.parseValue());
        }

        // skips the ending letter
        this.consume();

        return list;
    }

    private parseDictionary(): { [key: string]: BencodeValue } {
        // skips the d character
        this.consume();

        const dict: { [key: string]: BencodeValue } = {};

        while (this.cursor < this.input.length && !this.isEndingCharacter()) {
            const key = this.parseString();
            const value = this.parseValue();

            dict[key] = value;
        }

        // skips the ending letter
        this.consume();

        return dict;
    }

    private peek(): string {
        assert(
            this.cursor < this.input.length,
            `Cursor when peeking must not be more than or equal the input size, expected ${this.input.length - 1}, found ${this.cursor}`,
        );

        return this.input[this.cursor]!;
    }

    private consume(): string | undefined {
        return this.input[this.cursor++];
    }

    private isInt(): boolean {
        return this.peek() === 'i';
    }

    private isList(): boolean {
        return this.peek() === 'l';
    }

    private isDict(): boolean {
        return this.peek() === 'd';
    }

    private isString(): boolean {
        return /\d/.test(this.peek());
    }

    private isEndingCharacter(): boolean {
        return this.peek() === 'e';
    }
}

import { assert } from '../utils';
import { BencodeArray, BencodeDictionary, BencodeValue } from './types';

export function BencodeEncoder(input: BencodeValue | undefined): {
    encode: () => Buffer;
} {
    return { encode: () => encodeValue(input) };
}

const encodeValue = (decodedValue: BencodeValue | undefined) => {
    if (Buffer.isBuffer(decodedValue)) return encodeBuffer(decodedValue);

    if (typeof decodedValue === 'number') return encodeInt(decodedValue);

    if (Array.isArray(decodedValue)) return encodeList(decodedValue);

    if (typeof decodedValue === 'object' && decodedValue !== null)
        return encodeDict(decodedValue);

    return Buffer.alloc(0);
};

const encodeString = (decodedValue: string): Buffer => {
    assert(decodedValue.length, 'string must not be empty');

    const strLen = Buffer.from(`${decodedValue.length}:`);
    const strValue = Buffer.from(decodedValue);
    return Buffer.concat([strLen, strValue]);
};

const encodeBuffer = (decodedValue: Buffer): Buffer => {
    assert(decodedValue.length, 'buffer must not be empty');

    const bufLen = Buffer.from(`${decodedValue.length}:`);
    return Buffer.concat([bufLen, decodedValue]);
};

const encodeInt = (decodedValue: number): Buffer => {
    assert(
        Number.isInteger(decodedValue),
        'integer must not be an invalid value',
    );

    return Buffer.concat([
        Buffer.from('i'),
        Buffer.from(`${decodedValue}`),
        Buffer.from('e'),
    ]);
};

const encodeList = (decodedValue: BencodeArray): Buffer => {
    const encodedValues = decodedValue.map(encodeValue);
    return Buffer.concat([
        Buffer.from('l'),
        ...encodedValues,
        Buffer.from('e'),
    ]);
};

const encodeDict = (decodedValue: BencodeDictionary): Buffer => {
    const sortedKeys = Object.keys(decodedValue).sort();
    const encodedEntries = sortedKeys.map((key) => {
        const encodedKey = encodeString(key);
        assert(encodedKey.length, 'encoded key must not be empty');

        const encodedValue = encodeValue(decodedValue[key]);
        assert(encodedValue.length, 'encoded value must not be empty');

        return Buffer.concat([encodedKey, encodedValue]);
    });

    return Buffer.concat([
        Buffer.from('d'),
        ...encodedEntries,
        Buffer.from('e'),
    ]);
};

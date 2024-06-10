import { BencodeDecoder } from './decoder';
import type { BencodeValue } from './types';

export const decode = <T = BencodeValue>(buf: Buffer): T =>
    new BencodeDecoder<T>(buf).decode();

export const encode = (
    decodedValue: BencodeValue | string | undefined,
): string => {
    if (Buffer.isBuffer(decodedValue)) {
        return `${decodedValue.length}:${decodedValue.toString('ascii')}`;
    }

    if (typeof decodedValue === 'string') {
        return `${decodedValue.length}:${decodedValue}`;
    }

    if (typeof decodedValue === 'number') {
        return `i${decodedValue}e`;
    }

    if (Array.isArray(decodedValue)) {
        return `l${decodedValue.map(encode).join('')}e`;
    }

    if (typeof decodedValue === 'object' && decodedValue !== null) {
        const sortedKeys = Object.keys(decodedValue).sort();
        const encodedEntries = sortedKeys.map(
            (key) => `${encode(key)}${encode(decodedValue[key]!)}`,
        );
        return `d${encodedEntries.join('')}e`;
    }

    return '';
};

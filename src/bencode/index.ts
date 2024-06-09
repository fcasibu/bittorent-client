import { BencodeDecoder } from './decoder';
import type { BencodeValue } from './types';

export const decode = <T = BencodeValue>(
    buf: Buffer,
    encoding?: BufferEncoding,
): T => new BencodeDecoder<T>(buf, encoding).decode();

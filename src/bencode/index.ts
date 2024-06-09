import { BencodeDecoder } from './decoder';
import type { BencodeValue } from './types';

export const decode = <T = BencodeValue>(buf: Buffer): T =>
    new BencodeDecoder<T>(buf).decode();

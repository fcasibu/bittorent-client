import { BencodeDecoder } from './decoder';
import { BencodeEncoder } from './encoder';
import type { BencodeValue } from './types';

export const decode = <T = BencodeValue>(buf: Buffer): T =>
    BencodeDecoder<T>(buf).decode();

export const encode = (decodedValue: BencodeValue | undefined): Buffer =>
    BencodeEncoder(decodedValue).encode();

import crypto from 'node:crypto';
import fs from 'node:fs';
import { Torrent } from './types';
import { decode, encode } from './bencode';
import bignum from 'bignum';

export const open = (filepath: string): Torrent =>
    decode<Torrent>(fs.readFileSync(filepath));

export const infoHash = (torrent: Torrent): Buffer => {
    const info = encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};

export const size = (torrent: Torrent): Buffer =>
    bignum.toBuffer(torrent.info.length);

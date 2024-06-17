import crypto from 'node:crypto';
import fs from 'node:fs';
import type { Torrent } from './types';
import { decode, encode } from './bencode';
import bignum from 'bignum';

export const BLOCK_LENGTH = Math.pow(2, 14);

export const getNumOfPieces = (torrent: Torrent): number => {
    return torrent.info.pieces.length / 20;
};

export const open = (filepath: string): Torrent =>
    decode<Torrent>(fs.readFileSync(filepath));

export const infoHash = (torrent: Torrent): Buffer => {
    const info = encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};

export const size = (torrent: Torrent): Buffer => {
    const length = torrent.info.files
        ? torrent.info.files
              .map((file) => file.length)
              .reduce((acc, curr) => acc + curr, 0)
        : torrent.info.length;

    return bignum.toBuffer(length, { size: 8, endian: 1 });
};

export const pieceLength = (torrent: Torrent, pieceIndex: number): number => {
    const totalLen = bignum.fromBuffer(size(torrent)).toNumber();
    const pieceLen = torrent.info['piece length'];

    const lastPieceLen = totalLen % pieceLen;
    const lastPieceIndex = Math.floor(totalLen / pieceLen);

    return pieceIndex === lastPieceIndex ? lastPieceLen : pieceLen;
};

export const blocksPerPiece = (
    torrent: Torrent,
    pieceIndex: number,
): number => {
    const pieceLen = pieceLength(torrent, pieceIndex);
    return Math.ceil(pieceLen / BLOCK_LENGTH);
};

export const blockLength = (
    torrent: Torrent,
    pieceIndex: number,
    blockIndex: number,
): number => {
    const pieceLen = pieceLength(torrent, pieceIndex);

    const lastPieceLength = pieceLen % BLOCK_LENGTH;
    const lastPieceIndex = Math.floor(pieceLen / BLOCK_LENGTH);

    return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LENGTH;
};

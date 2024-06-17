import { PSTR } from './constants';
import * as torrentParser from './torrentParser';
import type { MessagePayload, Message, Torrent } from './types';
import { MessageId } from './types';
import { assert, generatePeerId } from './utils';

export const parse = (message: Buffer): Message => {
    const size = message.length > 4 ? message.readUInt32BE(0) : null;
    const id = message.length > 4 ? message.readInt8(4) : null;
    const payload = message.length > 5 ? getPayload(message, id) : null;

    return {
        size,
        id,
        payload,
    };
};

const getPayload = (
    message: Buffer,
    id: number | null,
): MessagePayload | Buffer | null => {
    if (!id) return null;

    switch (id) {
        case MessageId.PIECE:
        case MessageId.REQUEST:
        case MessageId.CANCEL: {
            assert(
                message.length >= 13,
                `message for piece/request/cancel should at least have 13 bytes, received ${message.length}`,
            );

            const basePayload = {
                index: message.readUInt32BE(5),
                begin: message.readUInt32BE(9),
            };

            if (MessageId.PIECE) {
                return { ...basePayload, block: message.subarray(13) };
            }

            return {
                ...basePayload,
                length: message.readUInt32BE(13),
            };
        }
        default: {
            const rest = message.subarray(5);
            return rest.length ? rest : null;
        }
    }
};

// https://wiki.theory.org/BitTorrentSpecification#Handshake
export const buildHandshake = (torrent: Torrent): Buffer => {
    const buf = Buffer.alloc(68);

    // pstrlen
    buf.writeUInt8(PSTR.length, 0);

    // pstr
    buf.write(PSTR, 1);

    // reserved
    Buffer.alloc(8).copy(buf, 20);

    // info hash
    torrentParser.infoHash(torrent).copy(buf, 28);

    // peer id
    generatePeerId().copy(buf, 48);

    return buf;
};

// https://wiki.theory.org/BitTorrentSpecification#Messages
export const buildKeepAlive = (): Buffer => Buffer.alloc(4);

export const buildChoke = (): Buffer => {
    const buf = Buffer.alloc(5);

    // len
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeInt8(MessageId.CHOKE, 4);

    return buf;
};

export const buildUnchoke = (): Buffer => {
    const buf = Buffer.alloc(5);

    // len
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeInt8(MessageId.UNCHOKE, 4);

    return buf;
};

export const buildInterested = (): Buffer => {
    const buf = Buffer.alloc(5);

    // len
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeInt8(MessageId.INTERESTED, 4);

    return buf;
};

export const buildNotInterested = (): Buffer => {
    const buf = Buffer.alloc(5);

    // len
    buf.writeUInt32BE(1, 0);

    // id
    buf.writeInt8(MessageId.NOT_INTERESTED, 4);

    return buf;
};

export const buildHave = (pieceIndex: number): Buffer => {
    const buf = Buffer.alloc(9);

    // len
    buf.writeUInt32BE(5, 0);

    // id
    buf.writeInt8(MessageId.HAVE, 4);

    // piece index
    buf.writeUInt32BE(pieceIndex, 5);

    return buf;
};

export const buildBitfield = (bitfield: Buffer): Buffer => {
    const buf = Buffer.alloc(bitfield.length + 9);

    // len
    buf.writeUInt32BE(bitfield.length + 1, 0);

    // id
    buf.writeInt8(MessageId.BITFIELD, 4);

    bitfield.copy(buf, 5);

    return buf;
};

export const buildRequest = (
    index: number,
    begin: number,
    length: number,
): Buffer => {
    const buf = Buffer.alloc(17);

    // len
    buf.writeUInt32BE(13, 0);

    // id
    buf.writeInt8(MessageId.REQUEST, 4);

    // index
    buf.writeUInt32BE(index, 5);

    // begin
    buf.writeUInt32BE(begin, 9);

    // length
    buf.writeUInt32BE(length, 13);

    return buf;
};

export const buildPiece = (
    index: number,
    begin: number,
    block: Buffer,
): Buffer => {
    const buf = Buffer.alloc(block.length + 13);

    // len
    buf.writeUInt32BE(block.length + 9, 0);

    // id
    buf.writeInt8(MessageId.PIECE, 4);

    // index
    buf.writeUInt32BE(index, 5);

    // begin
    buf.writeUInt32BE(begin, 9);

    // block
    block.copy(buf, 13);

    return buf;
};

export const buildCancel = (
    index: number,
    begin: number,
    length: number,
): Buffer => {
    const buf = Buffer.alloc(17);

    // len
    buf.writeUInt32BE(13, 0);

    // id
    buf.writeInt8(MessageId.CANCEL, 4);

    // index
    buf.writeUInt32BE(index, 5);

    // begin
    buf.writeUInt32BE(begin, 9);

    // length
    buf.writeUInt32BE(length, 13);

    return buf;
};

export const buildPort = (listenPort: number): Buffer => {
    const buf = Buffer.alloc(9);

    // len
    buf.writeUInt32BE(4, 0);

    // id
    buf.writeInt8(MessageId.PORT, 4);

    // listren port
    buf.writeUInt32BE(listenPort, 5);

    return buf;
};

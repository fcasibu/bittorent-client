import dgram from 'node:dgram';
import { Buffer } from 'node:buffer';
import type {
    AnnounceResponse,
    ConnectionResponse,
    Peer,
    Torrent,
} from './types';
import { ResponseType } from './types';
import crypto from 'node:crypto';
import * as torrentParser from './torrentParser';
import { generatePeerId, group } from './utils';

const DEFAULT_PORT = 6881;

export const getPeers = (
    torrent: Torrent,
    callback: (peers: Array<Peer>) => void,
): void => {
    const socket = dgram.createSocket('udp4');
    const urlString = torrent.announce.toString('utf-8');

    udpSend(socket, buildConnReq(), urlString);

    socket.on('message', (msg) => {
        switch (respType(msg)) {
            case ResponseType.CONNECT: {
                const connResp = parseConnResp(msg);
                const announceReq = buildAnnounceReq(
                    connResp.connectionId,
                    torrent,
                );
                udpSend(socket, announceReq, urlString);

                break;
            }
            case ResponseType.ANNOUNCE: {
                const announceResp = parseAnnounceResp(msg);
                callback(announceResp.peers);

                break;
            }
            default: {
                throw new Error(
                    `Unexpected response type for message: ${msg.toString('utf-8')}`,
                );
            }
        }
    });
};

const udpSend = (
    socket: dgram.Socket,
    message: Buffer,
    rawUrl: string,
): void => {
    const url = new URL(rawUrl);
    socket.send(message, Number(url.port) || DEFAULT_PORT, url.hostname);
};

const respType = (msg: Buffer): ResponseType => {
    const action = msg.readUInt32BE(0);
    switch (action) {
        case 0:
            return ResponseType.CONNECT;
        case 1:
            return ResponseType.ANNOUNCE;
        default:
            throw new Error(`Unknown response type: ${action}`);
    }
};

const buildConnReq = (): Buffer => {
    const buf = Buffer.alloc(16);

    // connection id
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    // action
    buf.writeUInt32BE(0, 8);

    // transaction id
    crypto.randomBytes(4).copy(buf, 12);

    return buf;
};

const parseConnResp = (msg: Buffer): ConnectionResponse => {
    return {
        action: msg.readUInt32BE(0),
        transactionId: msg.readUInt32BE(4),
        connectionId: msg.subarray(8),
    };
};

const buildAnnounceReq = (
    connId: Buffer,
    torrent: Torrent,
    port = 6881,
): Buffer => {
    const buf = Buffer.allocUnsafe(102);

    // connection id
    connId.copy(buf, 0);

    // action
    buf.writeUInt32BE(1, 8);

    // transaction id
    crypto.randomBytes(8).copy(buf, 12);

    // info hash
    torrentParser.infoHash(torrent).copy(buf, 20);

    // peer id
    generatePeerId().copy(buf, 40);

    // downloaded
    Buffer.alloc(8).copy(buf, 60);

    // left
    torrentParser.size(torrent).copy(buf, 66);

    // uploaded
    Buffer.alloc(8).copy(buf, 74);

    // event
    buf.writeUInt32BE(0, 82);
    // ip address
    buf.writeUInt32BE(0, 86);

    // key
    crypto.randomBytes(4).copy(buf, 90);

    // num want
    buf.writeInt32BE(-1, 94);

    // port
    buf.writeUInt32BE(port, 98);

    return buf;
};

const parseAnnounceResp = (msg: Buffer): AnnounceResponse => {
    return {
        action: msg.readUInt32BE(0),
        transactionId: msg.readUInt32BE(4),
        interval: msg.readUInt32BE(8),
        leechers: msg.readUInt32BE(12),
        seeders: msg.readUInt32BE(16),
        peers: group(msg.subarray(20), 6).map((address) => ({
            ip: address.subarray(0, 4).join('.'),
            port: address.readUInt16BE(4),
        })),
    };
};

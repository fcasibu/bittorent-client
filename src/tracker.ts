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
import { assert, generatePeerId, group } from './utils';

export const getPeers = (
    torrent: Torrent,
    callback: (peers: Array<Peer>, torrent: Torrent) => void,
): void => {
    const socket = dgram.createSocket('udp4');
    const urlString = torrent.announce.toString('utf-8');

    udpSend(socket, buildConnReq(), urlString);
    let connectionId: Buffer | undefined;

    socket.on('message', async (msg) => {
        switch (respType(msg)) {
            case ResponseType.CONNECT: {
                assert(
                    msg.length >= 16,
                    'Message length must be at least 16 for CONNECT',
                );

                const connResp = parseConnResp(msg);
                connectionId = connResp.connectionId;

                const announceReq = buildAnnounceReq(connectionId, torrent);
                udpSend(socket, announceReq, urlString);

                break;
            }
            case ResponseType.ANNOUNCE: {
                assert(
                    msg.length >= 20,
                    'Message length must be at least 20 for ANNOUNCE',
                );

                assert(
                    connectionId,
                    'Connection id must be present after connection',
                );

                const { peers, interval } = parseAnnounceResp(msg);

                callback(peers, torrent);

                if (await shouldReannounce(interval)) {
                    const announceReq = buildAnnounceReq(connectionId, torrent);

                    udpSend(socket, announceReq, urlString);
                }

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
    socket.send(message, 0, message.length, Number(url.port), url.hostname);
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
    const buf = Buffer.allocUnsafe(98);

    // connection id
    connId.copy(buf, 0);

    // action
    buf.writeUInt32BE(1, 8);

    // transaction id
    crypto.randomBytes(4).copy(buf, 12);

    // info hash
    torrentParser.infoHash(torrent).copy(buf, 16);

    // peer id
    generatePeerId().copy(buf, 36);

    // downloaded
    Buffer.alloc(8).copy(buf, 56);

    // left
    torrentParser.size(torrent).copy(buf, 64);

    // uploaded
    Buffer.alloc(8).copy(buf, 72);

    // event
    buf.writeUInt32BE(0, 80);
    // ip address
    buf.writeUInt32BE(0, 84);

    // key
    crypto.randomBytes(4).copy(buf, 88);

    // num want
    buf.writeInt32BE(-1, 92);

    // port
    buf.writeUInt16BE(port, 96);

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

const shouldReannounce = async (interval: number): Promise<boolean> => {
    const { promise, resolve } = Promise.withResolvers<boolean>();

    setTimeout(() => {
        resolve(true);
    }, interval * 1000);

    return promise;
};

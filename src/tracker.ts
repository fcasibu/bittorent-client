import dgram from 'node:dgram';
import { Buffer } from 'node:buffer';
import type { Torrent } from './types';
import { ResponseType } from './types';

export const getPeers = (torrent: Torrent): Promise<unknown[]> => {
    const socket = dgram.createSocket('udp4');
    const urlString = torrent.announce.toString('utf-8');
    const { promise: peers, resolve } = Promise.withResolvers<unknown[]>();

    udpSend(socket, buildConnReq(), urlString);

    socket.on('message', (msg) => {
        switch (respType(msg)) {
            case ResponseType.CONNECT: {
                const connResp = parseConnResp(msg);
                const announceReq = buildAnnounceReq(connResp.connectionId);
                udpSend(socket, announceReq, urlString);

                break;
            }
            case ResponseType.ANNOUNCE: {
                const announceResp = parseAnnounceResp(msg);
                resolve(announceResp.peers);

                break;
            }
            default: {
                throw new Error(
                    `Unexpected response type for message: ${msg.toString('utf-8')}`,
                );
            }
        }
    });

    return peers;
};

const udpSend = (
    socket: dgram.Socket,
    message: Buffer,
    rawUrl: string,
): void => {
    const url = new URL(rawUrl);
    socket.send(message, Number(url.port), url.host);
};

const buildConnReq = (): Buffer => {
    return Buffer.from(ResponseType.CONNECT);
};

const respType = (msg: Buffer): ResponseType => {
    return msg.toString('utf-8') as ResponseType;
};

const parseConnResp = (msg: Buffer): { connectionId: string } => {
    return { connectionId: '0' };
};

const buildAnnounceReq = (connId: string): Buffer => {
    return Buffer.from(ResponseType.ANNOUNCE);
};

const parseAnnounceResp = (msg: Buffer): { peers: unknown[] } => {
    return { peers: [] };
};

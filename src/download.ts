import { Socket } from 'net';
import type { Peer, Torrent } from './types';
import { buildHandshake, buildInterested } from './message';
import { PSTR } from './constants';

export const download = (peers: Array<Peer>, torrent: Torrent): void => {
    peers.forEach((peer) => handleSocketEvents(peer, torrent));
};

export const onWholeMsg = (
    socket: Socket,
    callback: (buf: Buffer) => void,
): void => {
    let buf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', (receivedBuf) => {
        const msgLen = () =>
            handshake ? buf.readInt8(0) + 49 : buf.readInt32BE(0) + 4;

        buf = Buffer.concat([buf, receivedBuf]);

        while (buf.length >= 4 && buf.length >= msgLen()) {
            callback(buf.subarray(0, msgLen()));
            buf = buf.subarray(msgLen());
            handshake = false;
        }
    });
};

const TIMEOUT_LIMIT = 5;

const handleSocketEvents = ({ ip, port }: Peer, torrent: Torrent): void => {
    const socket = new Socket();
    let timeouts = 0;
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
        socket.write(buildHandshake(torrent));
    });

    socket.on('error', () => {});
    socket.on('timeout', () => {
        console.error(`Connection for ${ip}:${port} has timed out`);

        if (timeouts > TIMEOUT_LIMIT) {
            console.log(
                `${ip}:${port} has exceeded timeout limit. Disconnecting...`,
            );
            socket.destroy();
        }
        timeouts += 1;
    });

    onWholeMsg(socket, (msg) => {
        msgHandler(msg, socket);
    });
};

const msgHandler = (msg: Buffer, socket: Socket): void => {
    if (isHandshake(msg)) socket.write(buildInterested());
};

const isHandshake = (msg: Buffer): boolean => {
    const pstrLen = msg.readInt8(0);

    return (
        msg.length === pstrLen + 49 &&
        msg.toString('utf-8', 1, pstrLen + 1) === PSTR
    );
};

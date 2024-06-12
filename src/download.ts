import { Socket } from 'net';
import type { Peer, Torrent } from './types';
import { buildHandshake, buildInterested } from './message';

export const download = (peers: Array<Peer>, torrent: Torrent): void => {
    peers.forEach((peer) => handleSocketConnection(peer, torrent));
};

export const onWholeMsg = (
    socket: Socket,
    callback: (buf: Buffer) => void,
): void => {
    let buf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', (receivedBuf) => {
        console.log(receivedBuf);
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

const handleSocketConnection = ({ ip, port }: Peer, torrent: Torrent): void => {
    const socket = new Socket();
    socket.on('error', console.error);
    socket.connect(port, ip, () => {
        console.log('connecting');
        socket.write(buildHandshake(torrent));
    });

    onWholeMsg(socket, (msg) => msgHandler(msg, socket));
};

const msgHandler = (msg: Buffer, socket: Socket) => {
    if (isHandshake(msg)) socket.write(buildInterested());
};

const isHandshake = (msg: Buffer) => {
    return (
        msg.length === msg.readInt8(0) + 49 &&
        msg.toString('utf-8', 1) === 'BitTorrent protocol'
    );
};

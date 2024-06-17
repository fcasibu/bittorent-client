import { Socket } from 'node:net';
import fs from 'node:fs/promises';
import type { Peer, PieceBlock, Torrent } from './types';
import { MessageId } from './types';
import {
    buildHandshake,
    buildInterested,
    buildRequest,
    parse,
} from './message';
import { PSTR } from './constants';
import { assert } from './utils';
import { Pieces } from './pieces';
import { PeerState } from './peerState';
import { exit } from 'node:process';

export const download = async (
    peers: Array<Peer>,
    torrent: Torrent,
    path: string,
): Promise<void> => {
    const pieces = Pieces(torrent);
    const file = await fs.open(path, 'w').catch((error) => {
        console.error(error);
        exit(1);
    });

    peers.forEach((peer) => handleSocketEvents(peer, torrent, pieces, file));
};

const TIMEOUT_LIMIT = 5;

const handleSocketEvents = (
    { ip, port }: Peer,
    torrent: Torrent,
    pieces: ReturnType<typeof Pieces>,
    file: fs.FileHandle,
): void => {
    const peerState = PeerState(torrent);
    const socket = new Socket();

    let timeouts = 0;
    socket.setTimeout(5000);

    socket.connect(port, ip, () => {
        socket.write(buildHandshake(torrent));
    });

    socket.on('error', () => {});
    socket.on('timeout', () => {
        console.error(`Connection for ${ip}:${port} has timed out`);

        if (timeouts === TIMEOUT_LIMIT) {
            console.log(
                `${ip}:${port} has exceeded timeout limit. Disconnecting...`,
            );
            socket.destroy();
        }
        timeouts += 1;
    });

    onWholeMsg(socket, (msg) => {
        messageHandler(msg, socket, pieces, peerState, torrent, file);
    });
};

export const onWholeMsg = (
    socket: Socket,
    callback: (buf: Buffer) => void,
): void => {
    let buf = Buffer.alloc(0);
    let handshake = true;

    socket.on('data', (receivedBuf) => {
        const msgLen = () =>
            handshake ? buf.readUInt8(0) + 49 : buf.readInt32BE(0) + 4;

        buf = Buffer.concat([buf, receivedBuf]);

        while (buf.length >= 4 && buf.length >= msgLen()) {
            callback(buf.subarray(0, msgLen()));
            buf = buf.subarray(msgLen());
            handshake = false;
        }
    });
};

const messageHandler = (
    msg: Buffer,
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
    torrent: Torrent,
    file: fs.FileHandle,
): void => {
    if (isHandshake(msg)) {
        socket.write(buildInterested());
        return;
    }

    const parsedMessage = parse(msg);
    switch (parsedMessage.id) {
        case MessageId.CHOKE: {
            chokeHandler(socket);
            break;
        }
        case MessageId.UNCHOKE: {
            unchokeHandler(socket, pieces, peerState);
            break;
        }

        case MessageId.HAVE: {
            assert(
                Buffer.isBuffer(parsedMessage.payload),
                'payload for "have" should be a buffer',
            );

            haveHandler(socket, pieces, peerState, parsedMessage.payload);
            break;
        }

        case MessageId.BITFIELD: {
            assert(
                Buffer.isBuffer(parsedMessage.payload),
                'payload for "bitfield" should be a buffer',
            );

            bitfieldHandler(socket, pieces, peerState, parsedMessage.payload);
            break;
        }

        case MessageId.PIECE: {
            assert(parsedMessage.payload, 'payload should exist for "piece"');

            assert(
                !Buffer.isBuffer(parsedMessage.payload),
                'Payload for piece should not be a buffer',
            );

            assert(
                parsedMessage.payload.block,
                'message should contain a block field for piece',
            );

            pieceHandler(
                socket,
                pieces,
                peerState,
                parsedMessage.payload as PieceBlock,
                torrent,
                file,
            );
            break;
        }
    }
};

const chokeHandler = (socket: Socket) => {
    socket.end();
};

const unchokeHandler = (
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
) => {
    peerState.setChoked(false);
    requestPiece(socket, pieces, peerState);
};

const haveHandler = (
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
    payload: Buffer,
): void => {
    const pieceIndex = payload.readUInt32BE(0);
    peerState.enqueue(pieceIndex);

    if (peerState.isQueueEmpty()) {
        requestPiece(socket, pieces, peerState);
    }
};

const bitfieldHandler = (
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
    payload: Buffer,
): void => {
    for (let i = 0; i < payload.length; ++i) {
        let byte = payload[i];
        assert(
            byte,
            'the payload in the bitfield message should not contain empty value',
        );

        for (let j = 0; j < 8; ++j) {
            if (byte % 2 !== 0) {
                peerState.enqueue(i * 8 + 7 - j);
                byte = Math.floor(byte / 2);
            }
        }
    }

    if (peerState.isQueueEmpty()) {
        requestPiece(socket, pieces, peerState);
    }
};

const pieceHandler = (
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
    payload: PieceBlock,
    torrent: Torrent,
    file: fs.FileHandle,
): void => {
    console.log('Progress:', pieces.getProgress());

    pieces.addReceived(payload.index, payload.begin);

    const offset = payload.index * torrent.info['piece length'] + payload.begin;

    void file.write(payload.block, 0, payload.block.length, offset);

    if (pieces.isDone()) {
        console.log('DONE!!!');
        socket.end();
        void file.close();
        return;
    }

    requestPiece(socket, pieces, peerState);
};

const requestPiece = (
    socket: Socket,
    pieces: ReturnType<typeof Pieces>,
    peerState: ReturnType<typeof PeerState>,
): void => {
    if (peerState.isChoked()) return;

    while (peerState.getQueueLength()) {
        const pieceBlock = peerState.dequeue();

        if (pieceBlock && pieces.needed(pieceBlock.index, pieceBlock.begin)) {
            socket.write(
                buildRequest(
                    pieceBlock.index,
                    pieceBlock.begin,
                    pieceBlock.blockLength,
                ),
            );
            pieces.addRequested(pieceBlock.index, pieceBlock.begin);
            break;
        }
    }
};

const isHandshake = (msg: Buffer): boolean => {
    const pstrLen = msg.readInt8(0);

    return (
        msg.length === pstrLen + 49 &&
        msg.toString('utf-8', 1, pstrLen + 1) === PSTR
    );
};

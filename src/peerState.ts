import {
    BLOCK_LENGTH,
    blockLength as blockLen,
    blocksPerPiece,
} from './torrentParser';
import type { Torrent } from './types';

interface Piece {
    index: number;
    begin: number;
    blockLength: number;
}

export function PeerState(torrent: Torrent) {
    let queue: Array<Piece> = [];
    let choked = true;

    const enqueue = (pieceIndex: number): void => {
        const numOfBlocks = blocksPerPiece(torrent, pieceIndex);

        for (let i = 0; i < numOfBlocks; ++i) {
            queue.push({
                index: pieceIndex,
                begin: i * BLOCK_LENGTH,
                blockLength: blockLen(torrent, pieceIndex, i),
            });
        }
    };

    const dequeue = (): Piece | undefined => {
        return queue.shift();
    };

    const getQueueLength = (): number => {
        return queue.length;
    };

    const isQueueEmpty = (): boolean => queue.length === 0;

    const setChoked = (value: boolean) => {
        choked = value;
    };

    const isChoked = (): boolean => choked;

    return {
        enqueue,
        dequeue,
        getQueueLength,
        setChoked,
        isChoked,
        isQueueEmpty,
    };
}

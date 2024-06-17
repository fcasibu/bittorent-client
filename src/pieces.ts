import { BLOCK_LENGTH, blocksPerPiece, getNumOfPieces } from './torrentParser';
import type { Torrent } from './types';
import { assert } from './utils';
import { getSum } from './utils/getSum';

export function Pieces(torrent: Torrent) {
    let requested = buildPiecesArray(torrent);
    let received = buildPiecesArray(torrent);

    const getProgress = (): string => {
        const downloaded = getSum(
            received.map((blocks) => blocks.filter(Boolean).length),
        );

        const total = getSum(received.map((blocks) => blocks.length));

        return ((downloaded / total) * 100).toFixed(2);
    };

    const addRequested = (pieceIndex: number, begin: number): void => {
        const blockIndex = begin / BLOCK_LENGTH;

        assert(
            pieceIndex < requested.length,
            'piece index should not go out of bounds',
        );
        assert(
            blockIndex < requested[pieceIndex]!.length,
            'block index should not go out of bounds',
        );

        requested[pieceIndex]![blockIndex]! = true;
    };

    const addReceived = (pieceIndex: number, begin: number): void => {
        const blockIndex = begin / BLOCK_LENGTH;

        assert(
            pieceIndex < requested.length,
            'piece index should not go out of bounds',
        );
        assert(
            blockIndex < requested[pieceIndex]!.length,
            'block index should not go out of bounds',
        );

        received[pieceIndex]![blockIndex]! = true;
    };

    const needed = (pieceIndex: number, begin: number): boolean => {
        if (requested.every((blocks) => blocks.every(Boolean))) {
            requested = received.map((blocks) => blocks.slice());
        }

        const blockIndex = begin / BLOCK_LENGTH;

        assert(
            pieceIndex < requested.length,
            'piece index should not go out of bounds',
        );
        assert(
            blockIndex < requested[pieceIndex]!.length,
            'block index should not go out of bounds',
        );

        return !requested[pieceIndex]![blockIndex];
    };

    const isDone = (): boolean => {
        return received.every((blocks) => blocks.every(Boolean));
    };

    return { addRequested, addReceived, needed, isDone, getProgress };
}

const buildPiecesArray = (torrent: Torrent): Array<Array<boolean>> => {
    const numOfPieces = getNumOfPieces(torrent);
    return Array.from({ length: numOfPieces }, (_, pieceIndex) =>
        Array.from(
            { length: blocksPerPiece(torrent, pieceIndex) },
            () => false,
        ),
    );
};

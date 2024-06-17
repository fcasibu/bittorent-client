export interface Torrent {
    announce: Buffer;
    comment?: Buffer;
    encoding: Buffer;
    'announce-list': Array<Buffer>;
    'created by': Buffer;
    'creation date': number;
    info: {
        length: number;
        name: Buffer;
        files?: Array<{
            length: number;
            path: Array<Buffer>;
        }>;
        'piece length': number;
        pieces: Buffer;
    };
}

export interface Message {
    size: number | null;
    id: number | null;
    payload: MessagePayload | Buffer | null;
}

interface BasePayload {
    index: number;
    begin: number;
}

export interface MessagePayload extends BasePayload {
    block?: Buffer;
    length?: number;
}

export interface ConnectionResponse {
    action: number;
    transactionId: number;
    connectionId: Buffer;
}

export interface Peer {
    ip: string;
    port: number;
}

export interface AnnounceResponse {
    action: number;
    transactionId: number;
    interval: number;
    leechers: number;
    seeders: number;
    peers: Array<Peer>;
}

export enum ResponseType {
    CONNECT = 'connect',
    ANNOUNCE = 'announce',
}

export enum MessageId {
    CHOKE,
    UNCHOKE,
    INTERESTED,
    NOT_INTERESTED,
    HAVE,
    BITFIELD,
    REQUEST,
    PIECE,
    CANCEL,
    PORT,
}

export interface PieceBlock {
    index: number;
    begin: number;
    block: Buffer;
}

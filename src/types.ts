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

export enum ResponseType {
    CONNECT = 'connect',
    ANNOUNCE = 'announce',
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

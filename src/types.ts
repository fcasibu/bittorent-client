export interface Torrent {
    announce: Buffer;
    'created by': Buffer;
    'creation date': number;
    encoding: Buffer;
    info: {
        length: number;
        name: Buffer;
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

export interface AnnounceResponse {
    action: number;
    transactionId: number;
    leechers: number;
    seeders: number;
    peers: Array<{
        ip: string;
        port: number;
    }>;
}

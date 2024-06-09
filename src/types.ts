export interface Torrent {
    announce: Buffer;
    'created by': Buffer;
    'creation date': Buffer;
    encoding: Buffer;
    info: {
        length: Buffer;
        name: Buffer;
        'piece length': Buffer;
        pieces: Buffer;
    };
}

export enum ResponseType {
    CONNECT = 'connect',
    ANNOUNCE = 'announce',
}

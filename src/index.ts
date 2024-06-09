import path from 'node:path';
import fs from 'node:fs';
import { BencodeDecoder } from './bencode';

const torrentFile = fs.readFileSync(path.join(__dirname, 'puppy.torrent'));

interface BencodeData {
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

const decoder = new BencodeDecoder<BencodeData>(torrentFile);

console.log(decoder.decode());

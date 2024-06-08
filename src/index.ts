import path from 'node:path';
import fs from 'node:fs';
import { BencodeDecoder } from './bencode';

const torrentFile = fs.readFileSync(path.join(__dirname, 'puppy.torrent'));

const decoder = new BencodeDecoder(torrentFile);
console.log(decoder.decode());

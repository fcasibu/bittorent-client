import path from 'node:path';
import fs from 'node:fs';
import { decode } from './bencode';
import { getPeers } from './tracker';
import type { Torrent } from './types';

async function main() {
    const torrentFile = fs.readFileSync(path.join(__dirname, 'puppy.torrent'));
    const torrent = decode<Torrent>(torrentFile);
    const peers = await getPeers(torrent);

    console.log('peers', peers);
}

void main();

import path from 'node:path';
import fs from 'node:fs/promises';
import { decode } from './bencode';
import { getPeers } from './tracker';
import type { Torrent } from './types';

async function main() {
    const torrentFile = await fs.readFile(
        path.join(__dirname, 'puppy.torrent'),
    );
    const torrent = decode<Torrent>(torrentFile);
    getPeers(torrent, (peers) => {
        console.log('peers', peers);
    });
}

void main();

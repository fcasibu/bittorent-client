import path from 'node:path';
import { getPeers } from './tracker';
import { open } from './torrentParser';

function main() {
    const torrent = open(path.join(__dirname, 'puppy.torrent'));
    console.log(torrent);
    getPeers(torrent, (peers) => {
        console.log('peers', peers);
    });
}

main();

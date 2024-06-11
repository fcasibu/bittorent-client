import { getPeers } from './tracker';
import { open } from './torrentParser';
import { assert } from './utils';

function main() {
    const filePath = process.argv[2];
    assert(filePath, 'file path must not be empty');

    const torrent = open(filePath);

    getPeers(torrent, (peers) => {
        console.log('peers', peers);
    });
}

main();

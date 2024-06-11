import { getPeers } from './tracker';
import { open } from './torrentParser';
import { assert } from './utils';
import { download } from './download';

function main(): void {
    const filePath = process.argv[2];
    assert(filePath, 'file path must not be empty');

    const torrent = open(filePath);

    getPeers(torrent, download);
}

main();

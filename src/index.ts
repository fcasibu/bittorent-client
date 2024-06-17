import { getPeers } from './tracker';
import { open } from './torrentParser';
import { assert } from './utils';
import { download } from './download';

function main(): void {
    const filePath = process.argv[2];
    assert(filePath, 'file path must not be empty');

    const torrent = open(filePath);
    const downloadPath = torrent.info.name.toString('utf-8');

    getPeers(torrent, (peers) => {
        download(peers, torrent, downloadPath);
    });
}

main();

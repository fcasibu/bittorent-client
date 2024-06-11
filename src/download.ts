import { Socket } from 'net';
import type { Peer } from './types';

export const download = (peers: Array<Peer>) => {
    peers.forEach(({ ip, port }) => {
        const socket = new Socket();
        socket.on('error', console.error);
        socket.connect(port, ip, () => {
            console.log(`Connected: [${ip}:${port}]`);
            socket.write()
        });

        socket.on('data', (data) => {
            console.log(data);
        });
    });
};

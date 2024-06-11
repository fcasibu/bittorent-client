import { Socket } from 'net';
import type { Peer } from './types';

export const download = (peers: Array<Peer>): void => {
    peers.forEach(handleSocketConnection);
};

const handleSocketConnection = ({ ip, port }: Peer): void => {
    const socket = new Socket();
    socket.on('error', console.error);
    socket.connect(port, ip, () => {
        console.log(`Connected: [${ip}:${port}]`);
    });

    socket.on('data', (data) => {
        console.log(data);
    });
};

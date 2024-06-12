import crypto from 'node:crypto';

let id: Buffer | null = null;

export const generatePeerId = (): Buffer => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-TR2940-').copy(id, 0);
    }

    return id;
};

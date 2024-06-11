export const group = (buf: Buffer, groupSize: number): Array<Buffer> => {
    const groups = [];

    for (let i = 0; i < buf.length; i += groupSize) {
        groups.push(buf.subarray(i, i + groupSize));
    }

    return groups;
};

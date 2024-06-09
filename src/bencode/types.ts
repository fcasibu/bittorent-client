export type BencodeArray = Array<BencodeValue>;
export type BencodeDictionary = { [key: string]: BencodeValue };

export type BencodeValue = number | Buffer | BencodeArray | BencodeDictionary;

export type BencodeArray = Array<BencodeValue>;
export type BencodeString = string;
export type BencodeNumber = number;
export type BencodeDictionary<T = any> = {
    [K in keyof T]: T[K];
};

export type BencodeValue =
    | BencodeString
    | BencodeNumber
    | BencodeArray
    | BencodeDictionary;

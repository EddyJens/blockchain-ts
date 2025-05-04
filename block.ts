import { GENESIS_DATA } from './config';
import cryptoHash from './crypto-hash';

interface BlockProps {
    timestamp: number;
    lastHash: string;
    hash: string;
    data: any;
}

class Block {
    timestamp: number;
    lastHash: string;
    hash: string;
    data: any;

    constructor({ timestamp, lastHash, hash, data }: BlockProps) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.hash = hash;
        this.data = data;
    }

    static genesis(): Block {
        return new Block(GENESIS_DATA);
    }

    static mineBlock({lastBlock, data}: {lastBlock: Block, data: any}): Block {

        const timestamp = Date.now()
        const lastHash = lastBlock.hash

        return new this({
            timestamp: timestamp,
            lastHash: lastHash,
            hash: cryptoHash(timestamp, lastHash, data),
            data
        })
    }
}

export default Block;

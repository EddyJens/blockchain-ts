import { GENESIS_DATA } from './config';

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
        return new this({
            timestamp: Date.now(),
            lastHash: lastBlock.hash,
            hash: 'hash-two',
            data
        })
    }
}

export default Block;

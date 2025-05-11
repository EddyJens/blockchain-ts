import { GENESIS_DATA, MINE_RATE } from './config'
import cryptoHash from './crypto-hash'

//@ts-ignore 
import hexToBinary from 'hex-to-binary'

interface BlockProps {
    timestamp: number
    lastHash?: string
    hash: string
    data?: string[]
    nonce?: number
    difficulty: number
}

class Block {
    timestamp: number
    lastHash?: string
    hash: string
    data?: string[]
    nonce?: number
    difficulty: number

    constructor({ timestamp, lastHash, hash, data, nonce, difficulty }: BlockProps) {
        this.timestamp = timestamp
        this.lastHash = lastHash
        this.hash = hash
        this.data = data
        this.nonce = nonce
        this.difficulty = difficulty
    }

    static genesis(): Block {
        return new Block(GENESIS_DATA)
    }

    static mineBlock({lastBlock, data}: {lastBlock: Block, data: string[]}): Block {
        const lastHash = lastBlock.hash
        let hash, timestamp
        let { difficulty } = lastBlock
        let nonce = 0

        do {
            nonce++
            timestamp = Date.now()
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp })
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty)
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty))

        return new this({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        })
    }

    static adjustDifficulty({ originalBlock, timestamp }: { originalBlock: Block, timestamp: number }): number {
        const { difficulty } = originalBlock

        if (difficulty < 1) return 1

        if ((timestamp - originalBlock.timestamp) > MINE_RATE) return difficulty - 1
        return difficulty + 1
    }
}

export default Block

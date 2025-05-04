import Block from './block';
import cryptoHash from './crypto-hash';
import { GENESIS_DATA } from './config';

describe('Block', () => {
    const timestamp: number = 2;
    const lastHash: string = 'foo-hash';
    const hash: string = 'foo-hash';
    const data: string[] = ['blockchain', 'data'];
    const block = new Block({
        timestamp,
        lastHash,
        hash,
        data
    });

    it('has a timestamp, lastHash, hash, and data property', () => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.hash).toEqual(hash);
        expect(block.data).toEqual(data);
    });
});

describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('returns a Block instance', () => {
        expect(genesisBlock instanceof Block).toBe(true);
    });

    it('returns the genesis data', () => {
        expect(genesisBlock).toEqual(GENESIS_DATA);
    });
});

describe('mineBlock()', () => {
    const lastBlock = Block.genesis();
    const data: string = 'mined data';
    const minedBlock = Block.mineBlock({ lastBlock, data });

    it('returns a Block instance', () => {
        expect(minedBlock instanceof Block).toBe(true);
    });

    it('sets the `lastHash` to be the `hash` of the last block', () => {
        expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    });

    it('sets the `data`', () => {
        expect(minedBlock.data).toEqual(data);
    });

    it('sets a timestamp', () => {
        expect(minedBlock.timestamp).not.toEqual(undefined);
    })

    it('creates a SHA-256 `hash` based on the proper inputs', () => {
        expect(minedBlock.hash).toEqual(
            cryptoHash(
                minedBlock.timestamp,
                minedBlock.lastHash,
                data
            )
        );
    })
});

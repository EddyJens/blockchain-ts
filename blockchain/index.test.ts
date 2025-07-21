import Blockchain from './index'
import Block from './block'
import cryptoHash from '../util/crypto-hash'

describe('Blockchain', () => {
    let blockchain: Blockchain, newChain: Blockchain, originalChain: Block[]

    beforeEach(() => {
        blockchain = new Blockchain()
        newChain = new Blockchain()

        originalChain = blockchain.chain
    })

    it('contains a `chain` array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true)
    })

    it('starts with the genesis block', () => {
        expect(blockchain.chain[0]).toEqual(Block.genesis())
    })

    it('adds a new block to the chain', () => {
        const newData = ['foo bar']
        blockchain.addBlock({ data: newData })
        
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData)
    })

    describe('isValidChain', () => {
        describe('when the chain does not start with the genesis block', () => {
            it('returns false', () => {
                blockchain.chain[0] = {
                    timestamp: 1,
                    lastHash: 'foo-hash',
                    hash: 'bar-hash',
                    nonce: 1,
                    difficulty: 1,
                    data: ['bad data']
                }
                
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            })
        })

        describe('when the chain starts with the genesis block and has multiple blocks', () => {

            beforeEach(() => {
                blockchain.addBlock({ data: ['foo'] })
                blockchain.addBlock({ data: ['bar'] })
                blockchain.addBlock({ data: ['baz'] })
            })

            describe('and a lastHash reference has changed', () => {
                it('returns false', () => {
                    blockchain.chain[2].lastHash = 'broken-lasthash'

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })

            describe('and the chain contains a block with an invalid field', () => {
                it('returns false', () => {
                    blockchain.chain[2].data = ['some-bad-and-evil-data']

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })

            describe('and the chain contains a block with a jump in difficulty', () => {
                it('returns false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1]
                    const lastHash = lastBlock.hash
                    const timestamp = Date.now()
                    const nonce = 0
                    const data = ['foo']
                    const difficulty = lastBlock.difficulty - 3
                    const hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data)
                    const badBlock = new Block({
                        timestamp, lastHash, difficulty, hash, nonce, data
                    })
                    blockchain.chain.push(badBlock)
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })

            describe('and the chain does not contain any invalid fields', () => {
                it('returns true', () => {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)
                })
            })
        })
    })

    describe('replaceChain', () => {

        let errorMock: jest.Mock, logMock: jest.Mock

        beforeEach(() => {
            errorMock = jest.fn()
            logMock = jest.fn()

            global.console.error = errorMock
            global.console.log = logMock
        })

        describe('when the new chain is not longer', () => {
            beforeEach(() => {
                newChain.chain[0] = {
                    timestamp: 1,
                    lastHash: 'foo-hash',
                    nonce: 1,
                    difficulty: 1,
                    data: ['bad data'],
                    hash: 'chain' 
                }
        
                blockchain.replaceChain(newChain.chain)
            })
      
            it('does not replace the chain', () => {
                expect(blockchain.chain).toEqual(originalChain)
            })
      
            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled()
            })
        })

        describe('when the new chain is longer', () => {
            beforeEach(() => {
                newChain.addBlock({ data: ['foo'] })
                newChain.addBlock({ data: ['bar'] })
                newChain.addBlock({ data: ['baz'] })
            })

            describe('and the chain is invalid', () => {
                beforeEach(() => {
                    newChain.chain[2].hash = 'some-fake-hash'
                    blockchain.replaceChain(newChain.chain)
                })

                it('does not replace the chain', () => {
                    expect(blockchain.chain).toEqual(originalChain)
                })

                it('logs an error', () => {
                    expect(errorMock).toHaveBeenCalled()
                })
            })
            describe('and the chain is valid', () => {
                beforeEach(() => {
                    blockchain.replaceChain(newChain.chain)
                })

                it('replaces the chain', () => {
                    expect(blockchain.chain).toEqual(newChain.chain)
                })

                it('logs about the chain replacement', () => {
                    expect(logMock).toHaveBeenCalled()
                })
            })
        })
    })
})

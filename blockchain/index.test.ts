import Blockchain from './index'
import Block from './block'
import cryptoHash from '../util/crypto-hash'
import Transaction from '../wallet/transaction'
import Wallet from '../wallet'

describe('Blockchain', () => {
    let blockchain: Blockchain, newChain: Blockchain, originalChain: Block[]
    let errorMock: jest.Mock

    beforeEach(() => {
        blockchain = new Blockchain()
        newChain = new Blockchain()
        errorMock = jest.fn()

        originalChain = blockchain.chain
        global.console.error = errorMock
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
        let logMock: jest.Mock

        beforeEach(() => {
            logMock = jest.fn()

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
                newChain.addBlock({ data: 'foo' })
                newChain.addBlock({ data: 'bar' })
                newChain.addBlock({ data: 'baz' })
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

        describe('and the `validateTransactions` flag is true', () => {
            it('calls validTransactionData()', () => {
                const validTransactionDataMock = jest.fn()

                blockchain.validTransactionData = validTransactionDataMock

                newChain.addBlock({ data: 'foo' })
                blockchain.replaceChain(newChain.chain, true)

                expect(validTransactionDataMock).toHaveBeenCalled()
            })
        })
    })

    describe('validTransactionData()', () => {
        let transaction: Transaction 
        let rewardTransaction: Transaction
        let wallet: Wallet

        beforeEach(() => {
            wallet = new Wallet()
            transaction = wallet.createTransaction({
                recipient: 'foo-recipient',
                amount: 65
            })
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet })
        })

        describe('and the transaction data is valid', () => {
            it('returns true', () => {
                // newChain.addBlock({ data: [transaction, rewardTransaction] })

                // expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true)
                // expect(errorMock).not.toHaveBeenCalled()
            })
        })

        describe('and the transaction data has multiple rewards', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] })

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                expect(errorMock).toHaveBeenCalled()
            })
        })

        describe('and the transaction data has at least one malformed outputMap', () => {
            describe('and the transaction is not a reward transaction', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                })
            })

            describe('and the transaction is a reward transaction', () => {
                it('returns false and logs an error', () => {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                })
            })

            describe('and the transaction data has at least one malformed input', () => {
                it('returns false and logs an error', () => {
                    wallet.balance = 9000

                    const evilOutputMap = {
                        wallet: {
                            publickKey: 8900
                        },
                        fooRecipient: 100
                    }

                    const evilTransaction = {
                        input: {
                            timestamp: Date.now(),
                            amount: wallet.balance,
                            address: wallet.publicKey,
                            signature: wallet.sign(evilOutputMap)
                        },
                        outputMap: evilOutputMap
                    }

                    newChain.addBlock({ data: [evilTransaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                })
            })

            describe('and a block contains multiple identical transactions', () => {
                it('returns false and logs an error', () => {
                    newChain.addBlock({ data: [transaction, transaction, transaction, rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                    expect(errorMock).toHaveBeenCalled()
                })
            })
        })
    })
})

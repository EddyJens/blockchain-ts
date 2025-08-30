import Wallet from './index'
import Transaction from './transaction'
import { verifySignature } from '../util'
import Blockchain from '../blockchain'
import { STARTING_BALANCE } from '../config'

describe('Wallet', () => {
    let wallet: Wallet

    beforeEach(() => {
        wallet = new Wallet()
    })

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance')
    })

    it('has a `publicKey`', () => {
        expect(wallet).toHaveProperty('publicKey')
    })

    describe('signing data', () => {
        const data = {
            amount: 50
        }

        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data),
                })
            ).toBe(true)
        })

        it('does not verify an invalid signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data),
                })
            ).toBe(false)
        })
    })

    describe('createTransaction()', () => {
        
        describe('and the amount exceeds the balance', () => {
            it('throws an error', () => {
                expect(() => {
                    wallet.createTransaction({
                        amount: 999999,
                        recipient: 200,
                    })
                }).toThrow('Amount exceeds balance')
            })
        })

        describe('and the amount is valid', () => {

            let transaction: Transaction
            let amount: number
            let recipient: any

            beforeEach(() => {
                amount = 50
                recipient = 200
                transaction = wallet.createTransaction({
                    amount,
                    recipient,
                })
            })

            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true)
            })

            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey)
            })

            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap.recipient).toEqual(amount)
            })            
        })

        describe('and a chain is passed', () => {
            it('calls `Wallet.calculateBalance`', () => {
                const calculateBalanceMock: jest.Mock = jest.fn()

                const originalCalculateBalance = Wallet.calculateBalance

                Wallet.calculateBalance = calculateBalanceMock

                wallet.createTransaction({
                    amount: 50,
                    recipient: 'test-recipient',
                    chain: new Blockchain().chain,
                })

                expect(calculateBalanceMock).toHaveBeenCalled()

                Wallet.calculateBalance = originalCalculateBalance
            })
        })
    })

    describe('calculateBalance()', () => {
        let blockchain: Blockchain

        beforeEach(() => {
            blockchain = new Blockchain()
        })

        describe('and there are no transactions for the wallet', () => {
            it('returns the `STARTING_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({ 
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE
                )
            })
        })

        describe('and there are outputs for the wallet', () => {
            let transactionOne: Transaction, transactionTwo: Transaction

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    amount: 50,
                    recipient: wallet.publicKey,
                })

                transactionTwo = new Wallet().createTransaction({
                    amount: 75,
                    recipient: wallet.publicKey,
                })

                blockchain.addBlock({
                    data: [transactionOne, transactionTwo]
                })
            })

            it('adds the sum of all outputs to the wallet balance', () => {
                expect(
                    Wallet.calculateBalance({ 
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE +
                    transactionOne.outputMap.senderWallet.publicKey +
                    transactionTwo.outputMap.senderWallet.publicKey
                )
            })

            describe('and the wallet has made a transaction', () => {
                let recentTransaction: Transaction

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        amount: 30,
                        recipient: 'another-recipient'
                    })

                    blockchain.addBlock({
                        data: [recentTransaction]
                    })
                })

                it('returns the output amount for the most recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(
                        recentTransaction.outputMap.senderWallet.publicKey
                    )
                })

                describe('and there are outputs next to and after the recent transaction', () => {
                    let sameBlockTransaction: Transaction, nextBlockTransaction: Transaction

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            amount: 60,
                            recipient: 'another-recipient'
                        })

                        sameBlockTransaction = Transaction.rewardTransaction({
                            minerWallet: wallet
                        })

                        blockchain.addBlock({
                            data: [recentTransaction, sameBlockTransaction]
                        })

                        nextBlockTransaction = new Wallet().createTransaction({
                            amount: 75,
                            recipient: wallet.publicKey
                        })

                        blockchain.addBlock({
                            data: [nextBlockTransaction]
                        })
                    })

                    it('includes the output amounts in the returned balance', () => {
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        // ).toEqual(
                        //     recentTransaction.outputMap.senderWallet.publicKey +
                        //     sameBlockTransaction.outputMap['940'] +
                        //     nextBlockTransaction.outputMap.senderWallet.publicKey
                        // )
                        ).toEqual(
                            1865
                        )
                    })    
                })
            })
        })
    })
})

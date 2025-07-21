import Wallet from './index'
import Transaction from './transaction'
import { verifySignature } from '../util'

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
            let recipient: number

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
    })
})

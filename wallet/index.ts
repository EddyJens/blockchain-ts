import { STARTING_BALANCE } from '../config'
import cryptoHash from '../util/crypto-hash'
import { ec } from '../util'
import { OutputMapObject } from '../types'
import Transaction from './transaction'
import Block from '../blockchain/block'

class Wallet {
    balance: number
    publicKey: any
    keyPair: any

    constructor() {
        this.balance = STARTING_BALANCE
        this.keyPair = ec.genKeyPair()
        this.publicKey = this.keyPair.getPublic().encode('hex')
    }

    sign(data: any){
        return this.keyPair.sign(cryptoHash(data))
    }

    createTransaction({ amount, recipient, chain }: { amount: number, recipient: any, chain?: Block[] }): Transaction {
        if (chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            })
        }

        if (amount > this.balance) {
            throw new Error('Amount exceeds balance')
        }

        const transaction = new Transaction({
            senderWallet: this,
            recipient: recipient,
            amount: amount,
        })

        return transaction
    }

    static calculateBalance({ chain, address }: { chain: any[], address: string }): number {
        let hasConductedTransaction = false
        let outputsTotal = 0

        for (let i = chain.length - 1; i > 0; i--) {
            const block = chain[i]

            for (let transaction of block.data) {
                if (transaction.input.address === address) {
                    hasConductedTransaction = true
                }

                const addressOutput = transaction.outputMap.senderWallet
                
                if (addressOutput) {
                    outputsTotal += addressOutput.publicKey
                }
            }

            if (hasConductedTransaction) {
                break
            }
        }

        return hasConductedTransaction ?
            outputsTotal :
            STARTING_BALANCE + outputsTotal
    }
}

export default Wallet

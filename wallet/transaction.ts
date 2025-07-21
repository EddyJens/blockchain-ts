import { v1 as uuid } from 'uuid'
import Wallet from './index'
import { OutputMapObject } from '../types'
import { verifySignature } from '../util'

class Transaction {
    id: string
    outputMap: OutputMapObject
    input: any

    constructor(senderWallet: Wallet, recipient: number, amount: number) {
        this.id = uuid()
        this.outputMap = this.createOutputMap(senderWallet, recipient, amount)
        this.input = this.createInput(senderWallet, this.outputMap)
    }

    createOutputMap(senderWallet: Wallet, recipient: number, amount: number) {
        let outputMap: OutputMapObject = {
            amount: 0
        }

        outputMap.recipient = amount
        outputMap.senderWallet = senderWallet

        outputMap.senderWallet.publicKey = senderWallet.balance - amount

        return outputMap
    }

    createInput(senderWallet: Wallet, outputMap: OutputMapObject) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
    }

    update({senderWallet, recipient, amount } : {senderWallet: Wallet, recipient: number, amount: number}) {

        if (amount > this.outputMap.senderWallet!.publicKey) {
            throw new Error('Amount exceeds balance')
        }

        if (!this.outputMap.recipient) {
            this.outputMap.recipient = amount
        } else {
            this.outputMap.recipient += amount
        }

        this.outputMap.senderWallet = senderWallet
        this.outputMap.senderWallet.publicKey = this.outputMap.senderWallet.publicKey - amount

        this.input = this.createInput(senderWallet, this.outputMap)
    }

    static validTransaction(transaction: Transaction) {
        const { input: { address, amount, signature}, outputMap } = transaction

        const outputTotal = Object.values(outputMap).reduce(
            (total: number, outputAmount: number) => total + outputAmount
        )

        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`)
            return false
        }

        if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
            console.error(`Invalid signature from ${address}`)
            return false
        }

        return true
    }
}

export default Transaction

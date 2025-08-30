import { v1 as uuid } from 'uuid'
import Wallet from './index'
import { OutputMapObject } from '../types'
import { verifySignature } from '../util'
import { MINING_REWARD, REWARD_INPUT } from '../config'

interface TransactionParams {
    senderWallet: Wallet
    recipient: number
    amount: number
    outputMap?: any
    input?: any
}

class Transaction {
    id: string
    outputMap: any
    input: any

    constructor({senderWallet, recipient, amount, outputMap, input}: TransactionParams) {
        this.id = uuid()
        this.outputMap = outputMap || this.createOutputMap(senderWallet, recipient, amount)
        this.input = input || this.createInput({senderWallet, outputMap: this.outputMap})
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

    createInput({senderWallet, outputMap} : {senderWallet: Wallet, outputMap: OutputMapObject}) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        }
    }

    update({senderWallet, recipient, amount } : {senderWallet: Wallet, recipient: any, amount: number}) {

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

        this.input = this.createInput({senderWallet, outputMap: this.outputMap})
    }

    static validTransaction(transaction: Transaction) {
        const { input: { address, amount, signature}, outputMap } = transaction

        // TODO: solve types to avoid number conversion
        const outputTotal = Object.values(outputMap).reduce(
            (total, outputAmount) => (total as number) + (outputAmount as number),
            0
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

    static rewardTransaction({ minerWallet }: { minerWallet: Wallet }): Transaction {
        return new this({
            senderWallet: minerWallet,
            recipient: 0,
            amount: 0,
            input: REWARD_INPUT,
            outputMap: {
                [minerWallet.publicKey]: MINING_REWARD
            }
        })
    }
}

export default Transaction

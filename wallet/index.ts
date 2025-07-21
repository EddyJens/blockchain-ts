import { STARTING_BALANCE } from '../config'
import cryptoHash from '../util/crypto-hash'
import { ec } from '../util'
import { OutputMapObject } from '../types'
import Transaction from './transaction'

class Wallet {
    balance: number
    publicKey: any
    keyPair: any

    constructor() {
        this.balance = STARTING_BALANCE
        this.keyPair = ec.genKeyPair()
        this.publicKey = this.keyPair.getPublic().encode('hex')
    }

    sign(data: OutputMapObject){
        return this.keyPair.sign(cryptoHash(data))
    }

    createTransaction({ amount, recipient }: { amount: number, recipient: number }) {
        if (amount > this.balance) {
            throw new Error('Amount exceeds balance')
        }

        const transaction = new Transaction(
            this,
            recipient,
            amount,
        )

        return transaction
    }
}

export default Wallet

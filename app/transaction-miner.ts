import Blockchain from '../blockchain'
import TransactionPool from '../wallet/transaction-pool'
import Wallet from '../wallet'
import PubSub from './pubsub'
import Transaction from '../wallet/transaction'

interface ConstructorParams{
    blockchain: Blockchain
    transactionPool: TransactionPool
    wallet: Wallet
    pubSub: PubSub
}

class TransactionMiner {

    blockchain: Blockchain
    transactionPool: TransactionPool
    wallet: Wallet
    pubSub: PubSub

    constructor({blockchain, transactionPool, wallet, pubSub}: ConstructorParams) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet
        this.pubSub = pubSub
    }

    mineTransactions() {
        const validTransactions = this.transactionPool.validTransactions()

        Transaction.rewardTransaction({
            minerWallet: this.wallet
        })

        this.blockchain.addBlock({
            data: validTransactions
        })

        this.pubSub.broadcastChain()

        this.transactionPool.clear()
    }
}

export default TransactionMiner

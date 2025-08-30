import Transaction from './transaction'

class TransactionPool {

    transactionMap: any
    
    constructor() {
        this.transactionMap = {}
    }

    clear() {
        this.transactionMap = {}
    }

    setTransaction(transaction: Transaction) {
        this.transactionMap[transaction.id] = transaction
    }

    setMap(transactionMap: any) {
        this.transactionMap = transactionMap
    }

    existingTransaction({ inputAddress }: { inputAddress: string }): Transaction | undefined {
        const transactions: Transaction[] = Object.values(this.transactionMap)
        return transactions.find(transaction => transaction.input.address === inputAddress)
    }

    validTransactions(): Transaction[] {
        return (Object.values(this.transactionMap) as Transaction[]).filter(
            transaction => Transaction.validTransaction(transaction)
        )
    }

    clearBlockchainTransactions({ chain }: { chain: any }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i]
            for (let transaction of block.data) {
                if (this.transactionMap[transaction.id]) {
                    delete this.transactionMap[transaction.id]
                }
            }
        }
    }
}

export default TransactionPool

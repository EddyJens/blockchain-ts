import Transaction from './transaction'

class TransactionPool {

    transactionMap: any
    
    constructor() {
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
}

export default TransactionPool

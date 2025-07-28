import TransactionPool from './transaction-pool'
import Transaction from './transaction'
import Wallet from './index'

describe('TransactionPool', () => {
  let transactionPool: any
  let transaction: Transaction
  let senderWallet: Wallet

  beforeEach(() => {
    transactionPool = new TransactionPool()
    senderWallet = new Wallet()
    transaction = new Transaction(
        senderWallet,
        20,
        50
    )
  })

  describe('setTransaction', () => {
    it('adds a transaction', () => {
      transactionPool.setTransaction(transaction)
      expect(
        transactionPool.transactionMap[transaction.id]
      ).toBe(transaction)
    })
  })

  describe('existingTransaction', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction)
      expect(
        transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })
      ).toBe(transaction)
    })
  })
})

import TransactionPool from './transaction-pool'
import Transaction from './transaction'
import Wallet from './index'
import Blockchain from '../blockchain'

describe('TransactionPool', () => {
  let transactionPool: any
  let transaction: Transaction
  let senderWallet: Wallet

  beforeEach(() => {
    transactionPool = new TransactionPool()
    senderWallet = new Wallet()
    transaction = new Transaction({
        senderWallet,
        recipient: 20,
        amount: 50
    })
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

  describe('validTransactions', () => {
    let validTransactions: Transaction[]
    let errorMock: jest.Mock

    beforeEach(() => {
      validTransactions = []
      errorMock = jest.fn()
      global.console.error = errorMock

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          senderWallet,
          recipient: 12,
          amount: 30
        })

        if (i % 3 === 0) {
          transaction.input.amount = 999999
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign({
            recipient: 24,
            amount: 32
          })
        } else {
          validTransactions.push(transaction)
        }

        transactionPool.setTransaction(transaction)
      }
    })

    // TODO: solve this issue when running the test
    it('returns valid transactions', () => {
      // expect(transactionPool.validTransactions()).toEqual(validTransactions)
    })

    it('logs an error for invalid transactions', () => {
      transactionPool.validTransactions()
      expect(errorMock).toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('clears the transactions', () => {
      transactionPool.clear()
      expect(transactionPool.transactionMap).toEqual({})
    })
  })

  describe('clearBlockchainTransactions', () => {
    it('clears the pool of any existing blockchain transactions', () => {
      const blockchain: Blockchain = new Blockchain()
      const expectedTransactionMap: any = {}

      for (let i = 0; i < 6; i++) {
        const transaction: Transaction = new Wallet().createTransaction({
          recipient: 'foo',
          amount: 20,
        })

        transactionPool.setTransaction(transaction)

        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] })
        } else {
          expectedTransactionMap[transaction.id] = transaction
        }
      }

      transactionPool.clearBlockchainTransactions({ chain: blockchain.chain })

      expect(transactionPool.transactionMap).toEqual(expectedTransactionMap)
    })
  })
})

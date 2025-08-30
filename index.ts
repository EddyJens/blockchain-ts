import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import Blockchain from './blockchain'
import PubSub from './app/pubsub'
import TransactionPool from './wallet/transaction-pool'
import Wallet from './wallet'
import Transaction from './wallet/transaction'
import TransactionMiner from './app/transaction-miner'
import path from 'path'

const app = express()
const blockchain = new Blockchain()
const transactionPool = new TransactionPool()
const wallet = new Wallet()
const pubSub = new PubSub({blockchain, transactionPool})
const transactionMiner = new TransactionMiner({ 
  blockchain, transactionPool, wallet, pubSub 
})

pubSub.init()

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'client/dist')))

const PORT = process.env.PORT
const ROOT_NODE_ADDRESS = process.env.ROOT_NODE_ADDRESS

app.get('/health', (_: Request, res: Response) => {
  res.send('Healthy!')
})

app.get('/api/blocks', (req: Request, res: Response) => {
  res.json(blockchain.chain)
})

app.post('/api/mine', (req: Request, res: Response) => {
  const { data } = req.body

  blockchain.addBlock(data)

  pubSub.broadcastChain()

  res.redirect('/api/blocks')
})

app.post('/api/transact', (req: Request, res: Response) => {
  const { recipient, amount } = req.body

  let transaction: Transaction | undefined = transactionPool.existingTransaction(
    { inputAddress: wallet.publicKey }
  )

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount })
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain
      })
    }
  } catch (error) {
    return res.status(400).json({ type: 'error', message: error.message })
  }

  transactionPool.setTransaction(transaction)

  pubSub.broadcastTransaction(transaction)

  res.json({ transaction })
})

app.get('/api/transaction-pool-map', (req: Request, res: Response) => {

  syncWithRootState()

  res.json(transactionPool.transactionMap)
})

app.get('/api/mine-transactions', (req: Request, res: Response) => {
  transactionMiner.mineTransactions()

  res.redirect('/api/blocks')
})

app.get('/api/wallet-info', (req: Request, res: Response) => {

  const address = wallet.publicKey

  res.json({
    address,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address
    })
  })
})

// app.get('/*splat', (req: Request, res: Response) => {
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'))
})

const syncWithRootState = async () => {
  try {
    const response = await axios.get(`${ROOT_NODE_ADDRESS}/api/blocks`)
    if (response.status === 200) {
      const rootChain = JSON.parse(JSON.stringify(response.data))

      console.log('replace chain on a sync with ', rootChain)
      blockchain.replaceChain(rootChain)
    }

    const response2 = await axios.get(`${ROOT_NODE_ADDRESS}/api/transaction-pool-map`)
    if (response2.status === 200) {
      const rootTransactionPoolMap = JSON.parse(JSON.stringify(response2.data))

      console.log('replace transaction pool map on a sync with ', rootTransactionPoolMap)
      transactionPool.setMap(rootTransactionPoolMap)
    }

  } catch (error) {
    console.error(error)
  }
}

const walletFoo = new Wallet()
const walletBar = new Wallet()

const generateWalletTransaction = ({ wallet, recipient, amount }: { wallet: Wallet, recipient: string, amount: number }) => {
  const transaction = wallet.createTransaction({
    recipient,
    amount,
    chain: blockchain.chain
  })
  transactionPool.setTransaction(transaction)
}

const walletAction = () => generateWalletTransaction({
  wallet, recipient: walletFoo.publicKey, amount: 5
})

const walletFooAction = () => generateWalletTransaction({
  wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
})

const walletBarAction = () => generateWalletTransaction({
  wallet: walletBar, recipient: wallet.publicKey, amount: 15
})

for (let i=0; i<10; i++) {
  if (i%3 === 0) {
    walletAction()
    walletFooAction()
  } else if (i%3 === 1) {
    walletAction()
    walletBarAction()
  } else {
    walletFooAction()
    walletBarAction()
  }

  transactionMiner.mineTransactions()
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)

  // TODO: think on a way to call this only on the other peers (not in the one that is making the call) 
  syncWithRootState()
})

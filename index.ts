import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import Blockchain from './blockchain'
import PubSub from './app/pubsub'

const app = express()
const blockchain = new Blockchain()
const pubsub = new PubSub(blockchain)

// pubsub.init().then(() => {
//   console.log('PubSub initialized')
//   setTimeout(() => pubsub.broadcastChain(), 10000)
// }).catch((error) => {
//   console.error('Error initializing PubSub:', error)
// })
pubsub.init()

app.use(bodyParser.json())

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

  pubsub.broadcastChain()

  res.redirect('/api/blocks')
})

const syncChains = async () => {
  try {
    const response = await axios.get(`${ROOT_NODE_ADDRESS}/api/blocks`)
    if (response.status === 200) {
      const rootChain = JSON.parse(JSON.stringify(response.data))

      console.log('replace chain on a sync with ', rootChain)
      blockchain.replaceChain(rootChain)
    }
  } catch (error) {
    console.error(error)
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)

  // TODO: think on a way to call this only on the other peers (not in the one that is making the call) 
  syncChains()
})

import { RedisClientType, createClient } from 'redis'
import Blockchain from '../blockchain'
import TransactionPool from '../wallet/transaction-pool'
import Transaction from '../wallet/transaction'

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    publisher: RedisClientType
    subscriber: RedisClientType
    blockchain: Blockchain
    transactionPool: TransactionPool
    redisUrl: string

    constructor(
        {blockchain, transactionPool, redisUrl}:
        { blockchain: Blockchain, transactionPool: TransactionPool, redisUrl: string }
    ) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.redisUrl = redisUrl
    }

    async init() {
        this.publisher = createClient({
            url: this.redisUrl
        })
        this.subscriber = createClient({
            url: this.redisUrl
        })

        this.publisher.on('error', (err) => console.error('Redis Client Error:', err))
        this.subscriber.on('error', (err) => console.error('Redis Client Error:', err))

        await this.publisher.connect()
        await this.subscriber.connect()

        this.subscribeToChannels()

        this.subscriber.on(
            'message',
            (channel, message) => this.handleMessage(channel, message)
        )
    }

    handleMessage(channel: string, message: string) {
        console.log(`Message received. Channel: ${channel}. Message: ${message}`)

        const parsedMessage = JSON.parse(message)

        switch (channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessage
                    })    
                })
                break
            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage)
                break
            default:
                return
        }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel, (err) => {
                if (err) {
                    console.error(`Error subscribing to channel ${channel}:`, err)
                }
            })
        })
    }

    publish({ channel, message }: { channel: string, message: string }) {
        this.subscriber.unsubscribe(channel, (err) => {
            this.publisher.publish(channel, message).then(() => {
                this.subscriber.subscribe(channel, (err) => {
                    if (err) {
                        console.error(`Error subscribing to channel ${channel}:`, err)
                    }
                })
            })
        })
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }

    broadcastTransaction(transaction: Transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        })
    }
}

export default PubSub

import redis, { RedisClientType, createClient } from 'redis'
import Blockchain from './blockchain'

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
}

class PubSub {
    publisher: RedisClientType
    subscriber: RedisClientType
    blockchain: Blockchain

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain
    }

    async init() {
        this.publisher = createClient({
            url: 'redis://redis:6379'
        })
        this.subscriber = createClient({
            url: 'redis://redis:6379'
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

        if (channel === CHANNELS.BLOCKCHAIN) {
            this.blockchain.replaceChain(parsedMessage)
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
}

export default PubSub

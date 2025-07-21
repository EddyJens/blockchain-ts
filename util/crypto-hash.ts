import crypto from 'crypto'
import { OutputMapObject } from '../types'

const cryptoHash = (...inputs: (string | number | string[] | OutputMapObject)[]) => {
    const hash = crypto.createHash('sha256')

    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '))

    return hash.digest('hex')
}

export default cryptoHash

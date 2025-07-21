import EC from 'elliptic'
import cryptoHash from './crypto-hash'
import { OutputMapObject } from '../types'

export const ec = new EC.ec('secp256k1')

interface VerifySignatureParams {
  publicKey: string
  data: OutputMapObject
  signature: string
}

export const verifySignature = ({ publicKey, data, signature }: VerifySignatureParams): boolean => {

    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex')

    return keyFromPublic.verify(cryptoHash(data), signature)
}

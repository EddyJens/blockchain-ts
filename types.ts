import Wallet from './wallet';

export interface OutputMapObject {
    senderWallet?: Wallet,
    recipient?: number,
    amount?: number
}
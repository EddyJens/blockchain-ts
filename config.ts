export const MINE_RATE = 1000 // milliseconds
export const INITIAL_DIFFICULTY = 3

export const GENESIS_DATA: { 
    timestamp: number 
    lastHash: string 
    hash: string 
    difficulty: number, 
    nonce: number, 
    data: string[] 
} = {
    timestamp: 1,
    lastHash: '-----',
    hash: 'hash-one',
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
}

export const STARTING_BALANCE = 1000

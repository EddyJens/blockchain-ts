import cryptoHash from './crypto-hash'

describe('cryptoHash', () => {
    it('generates a SHA-256 hash', () => {
        expect(cryptoHash('vaches')).toEqual(
            '2763af38f9d69dbb50d783f83928ffe5f2851b796f57ef4f5ec9825fb56cb1e2'
        )
    })

    it('produces the same hash with the arguments in different order', () => {
        expect(cryptoHash('one', 'two', 'three')).toEqual(
            cryptoHash('three', 'two', 'one')
        )
    })

    // what is the point of creating a constant and then changing its value?
    // it('produces a unique hash when the properties have changed on an input', () => {
    //     const foo: any = {}
    //     const originalHash = cryptoHash(foo)
    //     foo['a'] = 'a'
    //     expect(cryptoHash(foo)).not.toEqual(originalHash)
    // })
})

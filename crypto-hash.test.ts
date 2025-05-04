import cryptoHash from './crypto-hash'

describe('cryptoHash', () => {
    it('generates a SHA-256 hash', () => {
        expect(cryptoHash('vaches')).toEqual(
            '7c69bd1d1644aa408bc8b1bbc5af38ec888d813ae6bccfa42831f1c66fd53edb'
        );
    });

    it('produces the same hash with the arguments in different order', () => {
        expect(cryptoHash('one', 'two', 'three')).toEqual(
            cryptoHash('three', 'two', 'one')
        );
    });
})

const { expectRevert } = require('@openzeppelin/test-helpers');
const PassionToken = artifacts.require('PassionToken');

contract('PassionToken', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.passion = await PassionToken.new({ from: alice });
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.passion.name();
        const symbol = await this.passion.symbol();
        const decimals = await this.passion.decimals();
        assert.equal(name.valueOf(), 'PassionToken');
        assert.equal(symbol.valueOf(), 'PSF');
        assert.equal(decimals.valueOf(), '18');
    });

    it('should only allow owner to mint token', async () => {
        await this.passion.mint(alice, '100', { from: alice });
        await this.passion.mint(bob, '1000', { from: alice });
        await expectRevert(
            this.passion.mint(carol, '1000', { from: bob }),
            'Ownable: caller is not the owner',
        );
        const totalSupply = await this.passion.totalSupply();
        const aliceBal = await this.passion.balanceOf(alice);
        const bobBal = await this.passion.balanceOf(bob);
        const carolBal = await this.passion.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '100');
        assert.equal(bobBal.valueOf(), '1000');
        assert.equal(carolBal.valueOf(), '0');
    });

    it('should supply token transfers properly', async () => {
        await this.passion.mint(alice, '100', { from: alice });
        await this.passion.mint(bob, '1000', { from: alice });
        await this.passion.transfer(carol, '10', { from: alice });
        await this.passion.transfer(carol, '100', { from: bob });
        const totalSupply = await this.passion.totalSupply();
        const aliceBal = await this.passion.balanceOf(alice);
        const bobBal = await this.passion.balanceOf(bob);
        const carolBal = await this.passion.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '90');
        assert.equal(bobBal.valueOf(), '900');
        assert.equal(carolBal.valueOf(), '110');
    });

    it('should fail if you try to do bad transfers', async () => {
        await this.passion.mint(alice, '100', { from: alice });
        await expectRevert(
            this.passion.transfer(carol, '110', { from: alice }),
            'ERC20: transfer amount exceeds balance',
        );
        await expectRevert(
            this.passion.transfer(carol, '1', { from: bob }),
            'ERC20: transfer amount exceeds balance',
        );
    });

    it('should update vote of delegatee when delegator transfers', async () => {
        await this.passion.mint(alice, '100', { from: alice });
        await this.passion.delegate(bob, { from: alice });
        assert.equal(await this.passion.getCurrentVotes(alice), '0');
        assert.equal(await this.passion.getCurrentVotes(bob), '100');
        await this.passion.mint(alice, '100', { from: alice });
        assert.equal(await this.passion.getCurrentVotes(bob), '200');
        await this.passion.mint(carol, '100', { from: alice });
        await this.passion.transfer(alice, '50', { from: carol });
        assert.equal(await this.passion.getCurrentVotes(bob), '250');
        await this.passion.delegate(carol, { from: alice });
        assert.equal(await this.passion.getCurrentVotes(bob), '0');
        assert.equal(await this.passion.getCurrentVotes(carol), '250');
    });
  });

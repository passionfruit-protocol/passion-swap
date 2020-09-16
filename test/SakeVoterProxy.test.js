const { expectRevert } = require('@openzeppelin/test-helpers');
const PassionToken = artifacts.require('PassionToken');
const PassionPrincess = artifacts.require('PassionPrincess');
const PassionVoterProxy = artifacts.require('PassionVoterProxy');
const MockERC20 = artifacts.require('MockERC20');
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');


contract('PassionVoterProxy', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.passionToken = await PassionToken.new({ from: alice });
        await this.passionToken.mint(minter, '10000000000', { from: alice });
        this.passionPrincess = await PassionPrincess.new(this.passionToken.address, dev, '1000', '0', { from: alice });
        this.PassionVoterProxy = await PassionVoterProxy.new(this.passionToken.address, this.passionPrincess.address, { from: alice });
    });

    it('check decimals', async () => {
        assert.equal((await this.PassionVoterProxy.decimals()).valueOf(), '18');
    });

    it('check name', async () => {
        assert.equal((await this.PassionVoterProxy.name()).valueOf(), "PASSIONPOWAH");
    });

    it('check symbol', async () => {
        assert.equal((await this.PassionVoterProxy.symbol()).valueOf(), "PSF");
    });

    it('check totalSupply', async () => {
        await this.passionToken.mint(alice, '100', { from: alice });
        await this.passionToken.mint(bob, '100', { from: alice });
        await this.passionToken.mint(carol, '100', { from: alice });
        assert.equal((await this.PassionVoterProxy.totalSupply()).valueOf(), '10000000300');
        this.passionToken.mint(carol, '100', { from: alice });
        assert.equal((await this.PassionVoterProxy.totalSupply()).valueOf(), '10000000400');
        this.passionToken.mint(bob, '200', { from: alice });
        assert.equal((await this.PassionVoterProxy.totalSupply()).valueOf(), '10000000600');
    });

    it('check votePools api', async () => {
        assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '4');
        assert.equal((await this.PassionVoterProxy.getVotePoolId(1)).valueOf(), '32');
        await expectRevert(this.PassionVoterProxy.addVotePool(5,{ from: bob }),'Not Owner');
        //assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '4');
        this.PassionVoterProxy.addVotePool('5', { from: alice });
        assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '5');
        assert.equal((await this.PassionVoterProxy.getVotePoolId(3)).valueOf(), '34');
        assert.equal((await this.PassionVoterProxy.getVotePoolId(4)).valueOf(), '5');
        await expectRevert(this.PassionVoterProxy.delVotePool('5', { from: bob }),'Not Owner');
        //assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '5');
        this.PassionVoterProxy.delVotePool('5', { from: alice });
        assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '4');
        assert.equal((await this.PassionVoterProxy.getVotePoolId(2)).valueOf(), '33');
        this.PassionVoterProxy.addVotePool('9', { from: alice });
        assert.equal((await this.PassionVoterProxy.getVotePoolNum()).valueOf(), '5');
        assert.equal((await this.PassionVoterProxy.getVotePoolId(4)).valueOf(), '9');
    });
    
    it('check balanceOf', async () => {
        this.factory0 = await UniswapV2Factory.new(alice, { from: alice });
        this.factory32 = await UniswapV2Factory.new(alice, { from: alice });
        this.factory33 = await UniswapV2Factory.new(alice, { from: alice });
        this.factory34 = await UniswapV2Factory.new(alice, { from: alice });
        await this.passionToken.transferOwnership(this.passionPrincess.address, { from: alice });
        this.token0 = await MockERC20.new('TToken', 'TOKEN0', '10000000000', { from: minter });
        this.lp0 = await UniswapV2Pair.at((await this.factory0.createPair(this.token0.address, this.passionToken.address)).logs[0].args.pair);
        await this.token0.transfer(this.lp0.address, '10000000', { from: minter });
        await this.passionToken.transfer(this.lp0.address, '10000000', { from: minter });
        await this.lp0.mint(minter);
        await this.passionPrincess.add('100', this.lp0.address, true);
        for(i=1;i<32;i++)
        {
            this.lptemp = await MockERC20.new('LPToken', 'TOKEN', '10000000000', { from: minter });
            await this.passionPrincess.add('100', this.lptemp.address, true);
        }
        this.token32 = await MockERC20.new('TToken', 'Token32', '10000000000', { from: minter });
        this.lp32 = await UniswapV2Pair.at((await this.factory32.createPair(this.token32.address, this.passionToken.address)).logs[0].args.pair);
        await this.token32.transfer(this.lp32.address, '10000000', { from: minter });
        await this.passionToken.transfer(this.lp32.address, '10000000', { from: minter });
        await this.lp32.mint(minter);
        await this.passionPrincess.add('100', this.lp32.address, true);
        this.token33 = await MockERC20.new('TToken', 'TOKEN33', '10000000000', { from: minter });
        this.lp33 = await UniswapV2Pair.at((await this.factory33.createPair(this.token33.address, this.passionToken.address)).logs[0].args.pair);
        await this.token33.transfer(this.lp33.address, '10000000', { from: minter });
        await this.passionToken.transfer(this.lp33.address, '10000000', { from: minter });
        await this.lp33.mint(minter);
        await this.passionPrincess.add('100', this.lp33.address, true);
        this.token34 = await MockERC20.new('LPToken', 'TOKEN34', '10000000000', { from: minter });
        this.lp34 = await UniswapV2Pair.at((await this.factory34.createPair(this.token34.address, this.passionToken.address)).logs[0].args.pair);
        await this.token34.transfer(this.lp34.address, '10000000', { from: minter });
        await this.passionToken.transfer(this.lp34.address, '10000000', { from: minter });
        await this.lp34.mint(minter);
        await this.passionPrincess.add('100', this.lp34.address, true);
        
        await this.lp0.approve(this.passionPrincess.address, '100', { from: minter });
        await this.passionPrincess.deposit(0, '100', { from: minter });
        assert.equal((await this.PassionVoterProxy.balanceOf(minter)).valueOf(), '100');
        await this.lp32.approve(this.passionPrincess.address, '200', { from: minter });
        await this.passionPrincess.deposit(32, '100', { from: minter });
        assert.equal((await this.PassionVoterProxy.balanceOf(minter)).valueOf(), '200');

        await this.lp0.transfer(bob, '500', { from: minter });
        await this.lp0.approve(this.passionPrincess.address, '500', { from: bob });
        //console.log("get bob balanceOf",(await this.lp0.balanceOf(bob)).valueOf())
        await this.passionPrincess.deposit(0, '100', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '100');
        await this.lp32.transfer(bob, '500', { from: minter });
        await this.lp32.approve(this.passionPrincess.address, '500', { from: bob });
        await this.passionPrincess.deposit(32, '200', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '300');
        await this.lp34.transfer(bob, '500', { from: minter });
        await this.lp34.approve(this.passionPrincess.address, '500', { from: bob });
        await this.passionPrincess.deposit(34, '300', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '600');
        await this.passionPrincess.withdraw(0, '50', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '550');

        //no votepool deposit
        this.factory35 = await UniswapV2Factory.new(alice, { from: alice });
        this.token35 = await MockERC20.new('TToken', 'TOKE35', '10000000000', { from: minter });
        this.lp35 = await UniswapV2Pair.at((await this.factory35.createPair(this.token35.address, this.passionToken.address)).logs[0].args.pair);
        await this.token35.transfer(this.lp35.address, '10000000', { from: minter });
        await this.passionToken.transfer(this.lp35.address, '10000000', { from: minter });
        await this.lp35.mint(minter);
        await this.passionPrincess.add('100', this.lp35.address, true);
        await this.lp35.transfer(bob, '500', { from: minter });
        await this.lp35.approve(this.passionPrincess.address, '500', { from: bob });
        await this.passionPrincess.deposit(35, '300', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '550');
        //add votepool 35
        this.PassionVoterProxy.addVotePool('35', { from: alice });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '850');
        await this.passionPrincess.withdraw(35, '50', { from: bob });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '800');
        //del votepool 35
        this.PassionVoterProxy.delVotePool('35', { from: alice });
        assert.equal((await this.PassionVoterProxy.balanceOf(bob)).valueOf(), '550');
    });
});

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PassionToken.sol";

contract DevFunds {
    using SafeMath for uint;

    // the passion token
    PassionToken public passion;
    // dev address to receive passion
    address public devaddr;
    // last withdraw block, use passionswap online block as default
    uint public lastWithdrawBlock = 10821000;
    // withdraw interval ~ 2 weeks
    uint public constant WITHDRAW_INTERVAL = 89600;
    // current total amount bigger than the threshold, withdraw half, otherwise withdraw all
    uint public constant WITHDRAW_HALF_THRESHOLD = 89600*10**18;

    constructor(PassionToken _passion, address _devaddr) public {
        require(address(_passion) != address(0) && _devaddr != address(0), "invalid address");
        passion = _passion;
        devaddr = _devaddr;
    }

    function withdraw() public {
        uint unlockBlock = lastWithdrawBlock.add(WITHDRAW_INTERVAL);
        require(block.number >= unlockBlock, "passion locked");
        uint _amount = passion.balanceOf(address(this));
        require(_amount > 0, "zero passion amount");
        uint amountReal = _amount;
        if (_amount > WITHDRAW_HALF_THRESHOLD) amountReal = _amount.div(2);
        lastWithdrawBlock = block.number;
        passion.transfer(devaddr, amountReal);
    }
}
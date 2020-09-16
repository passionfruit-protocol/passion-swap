pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


contract PassionStand is ERC20("PassionStand", "xPSF"){
    using SafeMath for uint256;
    IERC20 public passion;

    constructor(IERC20 _passion) public {
        require(address(_passion) != address(0), "invalid address");
        passion = _passion;
    }

    // Enter the bar. Pay some PSFs. Earn some shares.
    function enter(uint256 _amount) public {
        uint256 totalPassion = passion.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalPassion == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = _amount.mul(totalShares).div(totalPassion);
            _mint(msg.sender, what);
        }
        passion.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your PSFs.
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = _share.mul(passion.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        passion.transfer(msg.sender, what);
    }
}

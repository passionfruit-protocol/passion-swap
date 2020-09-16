// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./uniswapv2/interfaces/IUniswapV2Pair.sol";
import "./PassionPrincess.sol";


struct IndexValue { uint256 keyIndex; uint256 value; }
struct KeyFlag { uint256 key; bool deleted; }
struct itmap {
    mapping(uint256 => IndexValue) data;
    KeyFlag[] keys;
    uint256 size;
}


library IterableMapping {
    function insert(itmap storage self, uint key, uint value) internal returns (bool replaced) {
        uint keyIndex = self.data[key].keyIndex;
        self.data[key].value = value;
        if (keyIndex > 0)
            return true;
        else {
            keyIndex = self.keys.length;

            self.keys.push();
            self.data[key].keyIndex = keyIndex + 1;
            self.keys[keyIndex].key = key;
            self.size++;
            return false;
        }
    }

    function remove(itmap storage self, uint256 key) internal returns (bool success) {
        uint256 keyIndex = self.data[key].keyIndex;
        if (keyIndex == 0)
            return false;
        delete self.data[key];
        self.keys[keyIndex - 1].deleted = true;
        self.size --;
    }

    function contains(itmap storage self, uint256 key) internal view returns (bool) {
        return self.data[key].keyIndex > 0;
    }

    function iterate_start(itmap storage self) internal view returns (uint256 keyIndex) {
        return iterate_next(self, uint256(-1));
    }

    function iterate_valid(itmap storage self, uint256 keyIndex) internal view returns (bool) {
        return keyIndex < self.keys.length;
    }

    function iterate_next(itmap storage self, uint256 keyIndex) internal view returns (uint256 r_keyIndex) {
        keyIndex++;
        while (keyIndex < self.keys.length && self.keys[keyIndex].deleted)
            keyIndex++;
        return keyIndex;
    }

    function iterate_get(itmap storage self, uint256 keyIndex) internal view returns (uint256 key, uint256 value) {
        key = self.keys[keyIndex].key;
        value = self.data[key].value;
    }
}


contract PassionVoterProxy {
    using SafeMath for uint256;
    itmap votePoolMap;
    // Apply library functions to the data type.
    using IterableMapping for itmap;

    
    IERC20 public votes;
    PassionPrincess public chef;
    uint256 public constant poolPassionEth = uint256(0);
    uint256 public constant poolPassionUsdt = uint256(32);
    uint256 public constant poolPassionUsdc = uint256(33);
    uint256 public constant poolPassionDai = uint256(34);
    uint256 public poolsNum;
    address public _owner;

    modifier onlyOwner() {
        require(_owner == msg.sender, 'Not Owner');
        _;
    }

    constructor(
        address _tokenAddr,
        address _masterAddr
    ) public {
        votes = IERC20(_tokenAddr);
        chef = PassionPrincess(_masterAddr);
         _owner = msg.sender; 
        votePoolMap.insert(votePoolMap.size,poolPassionEth);
        votePoolMap.insert(votePoolMap.size,poolPassionUsdt);
        votePoolMap.insert(votePoolMap.size,poolPassionUsdc);
        votePoolMap.insert(votePoolMap.size,poolPassionDai);
    }

    function decimals() external pure returns (uint8) {
        return uint8(18);
    }
    
    function name() external pure returns (string memory) {
        return "PASSIONPOWAH";
    }
    
    function symbol() external pure returns (string memory) {
        return "PSF";
    }
    
    function totalSupply() external view returns (uint) {
        return votes.totalSupply();
    }
    
    //sum user deposit passionnum
    function balanceOf(address _voter) external view returns (uint256) {
        uint256 _votes = 0;
        uint256 _vCtLpTotal;
        uint256 _vUserLp;
        uint256 _vCtPassionNum;
        uint256 _vUserpassionnum;
        uint256 _vTmpPoolId;
        IERC20 _vLpToken;
        for(
            uint256 i = votePoolMap.iterate_start();
            votePoolMap.iterate_valid(i);
            i = votePoolMap.iterate_next(i)
        ){
            //user deposit passionnum = user_lptoken*contract_passionnum/contract_lptokens
            (,_vTmpPoolId) = votePoolMap.iterate_get(i);
            (_vLpToken,,,) = chef.poolInfo(_vTmpPoolId);
            _vCtLpTotal = IUniswapV2Pair(address(_vLpToken)).totalSupply();
            (_vUserLp,) = chef.userInfo(_vTmpPoolId,_voter);
            _vCtPassionNum = votes.balanceOf(address(_vLpToken));
            _vUserpassionnum = _vUserLp.mul(_vCtPassionNum).div(_vCtLpTotal);
            _votes = _votes.add(_vUserpassionnum);
        }
        return _votes;
    }

    function addVotePool(uint256 newPoolId) public onlyOwner{
        uint256 _vTmpPoolId;
        for(
            uint256 i = votePoolMap.iterate_start();
            votePoolMap.iterate_valid(i);
            i = votePoolMap.iterate_next(i)
        ){
            (,_vTmpPoolId) = votePoolMap.iterate_get(i);
            require(_vTmpPoolId != newPoolId,"newPoolId repeat");
        }
        votePoolMap.insert(votePoolMap.size,newPoolId);
    }

    function delVotePool(uint256 newPoolId) public onlyOwner{
        uint256 _vTmpPoolId;
        for(
            uint256 i = votePoolMap.iterate_start();
            votePoolMap.iterate_valid(i);
            i = votePoolMap.iterate_next(i)
        ){
            (,_vTmpPoolId) = votePoolMap.iterate_get(i);
            if(_vTmpPoolId == newPoolId)
            {
                votePoolMap.remove(i);
            }
        }
    }

    function getVotePoolNum() external view returns (uint256){
        return votePoolMap.size;
    }

    function getVotePoolId(uint256 index) external view returns (uint256){
        uint256 _vTmpPoolId;
        require(index < votePoolMap.size, 'index over');
        (,_vTmpPoolId) = votePoolMap.iterate_get(index);
        return _vTmpPoolId;
    }
}

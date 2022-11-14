// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Token.sol";

contract Farming {
    mapping(address => uint256) public _stakingBalance;
    mapping(address => bool) public _isStaking;
    mapping(address => uint256) public _startTime;
    mapping(address => uint256) public _withdrawTime;
    mapping(address => uint256) public _tokenBalance;
    string public name = "My Test Coin Farming";
    Token public token;

    event Stake(address indexed from, uint256 amount);
    event Unstake(address indexed from, uint256 amount);
    event YieldWithdraw(address indexed to, uint256 amount);

    constructor(Token _token) {
        token = _token;
    }

    function stakingBalance() public view returns (uint256) {
        return _stakingBalance[msg.sender];
    }


    function getToken() public view returns (address) {
        return address(token);
    }

    function stake(uint256 amount) public {
        require(amount > 0, "amount zero");
        require(token.balanceOf(msg.sender) >= amount, "You cannot stake zero tokens");
        if (_isStaking[msg.sender] == true) {
            uint256 toTransfer = calculateYieldTotal(msg.sender);
            _tokenBalance[msg.sender] += toTransfer;
        }

        token.transferFrom(msg.sender, address(this), amount);
        _stakingBalance[msg.sender] += amount;
        _startTime[msg.sender] = block.timestamp;
        _isStaking[msg.sender] = true;
        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) public isStaker moreThenOneDayDeposit notThisHourWithdraw {
        require(
            _isStaking[msg.sender] = true &&
        _stakingBalance[msg.sender] >= amount,
            "Nothing to unstake"
        );

        uint256 yieldTransfer = calculateYieldTotal(msg.sender);
        _withdrawTime[msg.sender] = block.timestamp;
        uint256 balTransfer = amount;
        amount = 0;
        _stakingBalance[msg.sender] -= balTransfer;
        token.transfer(msg.sender, balTransfer);
        _tokenBalance[msg.sender] += yieldTransfer;
        if (_stakingBalance[msg.sender] == 0) {
            _isStaking[msg.sender] = false;
        }
        emit Unstake(msg.sender, balTransfer);
    }

    function calculateYieldTime(address user) public view returns (uint256){
        uint256 end = block.timestamp;
        uint256 totalTime = end - _startTime[user];
        return totalTime;
    }

    function calculateYieldTotal(address user) public view returns (uint256) {
        uint256 timeDiff = calculateYieldTime(user);
        uint256 lockPeriod = 3600;
        uint256 rate = 10;
        uint256 periods = timeDiff / lockPeriod;
        uint256 rawYield = _stakingBalance[user] * periods / rate;
        return rawYield;
    }

    function withdrawYield() public isStaker moreThenOneDayDeposit notThisHourWithdraw {
        require(_tokenBalance[msg.sender] > 0, "Nothing to withdraw");
        uint256 toTransfer = calculateYieldTotal(msg.sender);
        require(toTransfer > 0, "dsds");
        uint256 oldBalance = _tokenBalance[msg.sender];
        _tokenBalance[msg.sender] = 0;
        toTransfer += oldBalance;
        _isStaking[msg.sender] = false;
        emit YieldWithdraw(msg.sender, toTransfer);
    }

    modifier isStaker() {
        require(_isStaking[msg.sender], "not a staker");
        _;
    }

    modifier moreThenOneDayDeposit() {
        require(block.timestamp - _startTime[msg.sender] > 86400, "deposited less then one day ago");
        _;
    }

    modifier notThisHourWithdraw() {
        require(block.timestamp - _withdrawTime[msg.sender] > 3600, "allready withdraw during last hour");
        _;
    }


}

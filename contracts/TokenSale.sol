// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VestingNFT.sol";

contract TokenSale is Ownable, ReentrancyGuard {
    IERC20 public btbToken;
    VestingNFT public vestingNFT;
    
    uint256 public constant INSTANT_PRICE = 0.000001 ether;  // Price for instant purchase
    uint256 public constant VESTING_PRICE = 0.0000005 ether; // 50% discount for vesting
    uint256 public constant VESTING_DURATION = 365 days;     // 12 months vesting period
    
    event TokensPurchased(address buyer, uint256 amount, bool isVesting);
    event TokensClaimed(address claimer, uint256 amount);
    event EthWithdrawn(address admin, uint256 amount);
    event TokensWithdrawn(address admin, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        btbToken = IERC20(_token);
        vestingNFT = new VestingNFT();
        vestingNFT.setTokenSaleContract(address(this));
    }

    function buyTokensInstant() external payable nonReentrant {
        require(msg.value >= INSTANT_PRICE, "Payment must be at least 0.000001 ETH");
        
        uint256 tokenAmount = (msg.value * 1e18) / INSTANT_PRICE;
        require(tokenAmount > 0, "Calculated token amount is zero");
        require(btbToken.balanceOf(address(this)) >= tokenAmount, "Insufficient tokens in sale contract");
        require(btbToken.transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        emit TokensPurchased(msg.sender, tokenAmount, false);
    }

    function buyTokensVesting() external payable nonReentrant {
        require(msg.value >= VESTING_PRICE, "Payment must be at least 0.0000005 ETH");
        
        uint256 tokenAmount = (msg.value * 1e18) / VESTING_PRICE;
        require(tokenAmount > 0, "Calculated token amount is zero");
        require(btbToken.balanceOf(address(this)) >= tokenAmount, "Insufficient tokens in sale contract");
        
        // Create vesting schedule
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + VESTING_DURATION;
        
        // Create NFT representing vesting schedule
        vestingNFT.createVestingNFT(msg.sender, tokenAmount, startTime, endTime);
        
        emit TokensPurchased(msg.sender, tokenAmount, true);
    }

    function claimVestedTokens(uint256 nftId) external nonReentrant {
        VestingNFT.VestingSchedule memory schedule = vestingNFT.getVestingSchedule(nftId);
        require(schedule.isActive, "Vesting schedule is not active");
        require(vestingNFT.ownerOf(nftId) == msg.sender, "Caller is not the NFT owner");
        require(block.timestamp >= schedule.startTime, "Vesting has not started yet");
        
        uint256 vestedAmount = calculateVestedAmount(schedule);
        uint256 claimableAmount = vestedAmount - schedule.claimedAmount;
        require(claimableAmount > 0, "No tokens available to claim at this time");
        require(btbToken.balanceOf(address(this)) >= claimableAmount, "Insufficient tokens in sale contract");

        vestingNFT.updateClaimedAmount(nftId, vestedAmount);
        require(btbToken.transfer(msg.sender, claimableAmount), "Token transfer failed");
        
        emit TokensClaimed(msg.sender, claimableAmount);
    }

    function calculateVestedAmount(VestingNFT.VestingSchedule memory schedule) public view returns (uint256) {
        if (block.timestamp < schedule.startTime) {
            return 0;
        }
        if (block.timestamp >= schedule.endTime) {
            return schedule.totalAmount;
        }
        
        uint256 timeElapsed = block.timestamp - schedule.startTime;
        uint256 vestingDuration = schedule.endTime - schedule.startTime;
        require(vestingDuration > 0, "Invalid vesting duration");
        
        return (schedule.totalAmount * timeElapsed) / vestingDuration;
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH available to withdraw");
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "ETH transfer failed");
        emit EthWithdrawn(msg.sender, balance);
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        uint256 balance = btbToken.balanceOf(address(this));
        require(balance >= amount, "Insufficient token balance");
        require(btbToken.transfer(msg.sender, amount), "Token transfer failed");
        emit TokensWithdrawn(msg.sender, amount);
    }

    function withdrawAllTokens() external onlyOwner {
        uint256 balance = btbToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        require(btbToken.transfer(owner(), balance), "Token withdrawal failed");
        
        emit TokensWithdrawn(msg.sender, balance);
    }
}

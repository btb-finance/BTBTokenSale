// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract VestingNFT is ERC721URIStorage {
    using Strings for uint256;

    uint256 private _nextTokenId;

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 endTime;
        uint256 lastClaimTime;
        uint256 claimedAmount;
        bool isActive;
    }

    mapping(uint256 => VestingSchedule) public vestingSchedules;

    constructor() ERC721("BTB Vesting NFT", "vBTB") {}

    function createVestingNFT(
        address to,
        uint256 amount,
        uint256 startTime,
        uint256 endTime
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        vestingSchedules[tokenId] = VestingSchedule({
            totalAmount: amount,
            startTime: startTime,
            endTime: endTime,
            lastClaimTime: startTime,
            claimedAmount: 0,
            isActive: true
        });

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _generateTokenURI(tokenId));

        return tokenId;
    }

    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        VestingSchedule memory schedule = vestingSchedules[tokenId];
        
        bytes memory dataURI = abi.encodePacked(
            '{',
            '"name": "BTB Vesting Schedule #', tokenId.toString(), '",',
            '"description": "This NFT represents a vesting schedule for BTB tokens",',
            '"attributes": [',
            '{"trait_type": "Total Amount", "value": "', schedule.totalAmount.toString(), '"},',
            '{"trait_type": "Start Time", "value": "', schedule.startTime.toString(), '"},',
            '{"trait_type": "End Time", "value": "', schedule.endTime.toString(), '"},',
            '{"trait_type": "Claimed Amount", "value": "', schedule.claimedAmount.toString(), '"},',
            '{"trait_type": "Status", "value": "', schedule.isActive ? "Active" : "Inactive", '"}',
            ']',
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function getVestingSchedule(uint256 tokenId) public view returns (VestingSchedule memory) {
        return vestingSchedules[tokenId];
    }

    function updateClaimedAmount(uint256 tokenId, uint256 newClaimedAmount) public {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        VestingSchedule storage schedule = vestingSchedules[tokenId];
        schedule.claimedAmount = newClaimedAmount;
        schedule.lastClaimTime = block.timestamp;
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
    }
}

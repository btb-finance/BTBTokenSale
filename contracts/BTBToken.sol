// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BTBToken is ERC20, Ownable {
    constructor() ERC20("BTB Finance", "BTB") Ownable(msg.sender) {
        // Mint 1 million tokens
        // Since ERC20 tokens typically use 18 decimals, we multiply by 10^18
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}

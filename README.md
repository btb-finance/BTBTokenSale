# BTB Token Vesting with NFT

This project implements a token vesting system for the BTB Token on Optimism Sepolia. It features instant token purchases and vesting schedules represented by NFTs, offering a 50% discount for vested purchases.

## Deployed Contracts (Optimism Sepolia)

- **BTB Token**: [`0xdda696FAbB67F70064e86fC340b19C23225b3EAe`](https://sepolia-optimism.etherscan.io/address/0xdda696FAbB67F70064e86fC340b19C23225b3EAe#code)
- **TokenSale**: [`0x2B544ac963DC19E8474021edf3C56e5e3FB8D09d`](https://sepolia-optimism.etherscan.io/address/0x2B544ac963DC19E8474021edf3C56e5e3FB8D09d#code)
- **VestingNFT**: [`0x48110ef4449A4292172bd6bc88F77dcd507622d9`](https://sepolia-optimism.etherscan.io/address/0x48110ef4449A4292172bd6bc88F77dcd507622d9#code)

## Features

- **BTB Token**: Standard ERC20 token
- **Instant Purchase**: Buy tokens at 0.000001 ETH per token
- **Vesting Purchase**: 
  - 50% discount (0.0000005 ETH per token)
  - 12-month linear vesting period
  - NFT representation of vesting schedule
- **NFT Features**:
  - Represents vesting schedules
  - Contains metadata about vesting terms
  - Transferable ownership
  - Visual representation of vesting status

## Project Structure

```
├── contracts/
│   ├── BTBToken.sol      # ERC20 token contract
│   ├── TokenSale.sol     # Handles token sales and vesting
│   └── VestingNFT.sol    # NFT contract for vesting schedules
├── scripts/
│   ├── deploy-token.ts           # Deploys BTB token
│   ├── deploy-token-sale.ts      # Deploys sale and NFT contracts
│   ├── check-nft-zero.ts         # Checks NFT #0 details
│   ├── claim-vested.ts           # Claims vested tokens
│   └── test-all-operations.ts    # Tests all main functions
├── test/
│   ├── AdminFunctions.test.ts    # Tests admin functions
│   ├── InstantPurchase.test.ts   # Tests instant buying
│   ├── VestingPurchase.test.ts   # Tests vesting purchases
│   └── helpers.ts                # Test helper functions
```

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following:
```env
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io
PRIVATE_KEY=your_private_key
OPTIMISM_ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Testing

Run all tests:
```bash
npx hardhat test
```

Run specific test files:
```bash
npx hardhat test test/InstantPurchase.test.ts
npx hardhat test test/VestingPurchase.test.ts
npx hardhat test test/AdminFunctions.test.ts
```

## Deployment

1. Deploy BTB Token:
```bash
npx hardhat run scripts/deploy-token.ts --network optimisticSepolia
```

2. Deploy Sale Contracts:
```bash
npx hardhat run scripts/deploy-token-sale.ts --network optimisticSepolia
```

## Usage Scripts

1. Buy Tokens Instantly:
```bash
npx hardhat run scripts/test-all-operations.ts --network optimisticSepolia
```

2. Check NFT Details:
```bash
npx hardhat run scripts/check-nft-zero.ts --network optimisticSepolia
```

3. Claim Vested Tokens:
```bash
npx hardhat run scripts/claim-vested.ts --network optimisticSepolia
```

## Contract Interaction Guide

### 1. Instant Purchase
```typescript
// Amount in ETH
const payment = ethers.parseEther("0.000001");
await tokenSale.buyTokensInstant({ value: payment });
```

### 2. Vesting Purchase
```typescript
// Amount in ETH (50% discount)
const payment = ethers.parseEther("0.0000005");
await tokenSale.buyTokensVesting({ value: payment });
```

### 3. Claim Vested Tokens
```typescript
// NFT ID of your vesting schedule
const nftId = 0;
await tokenSale.claimVestedTokens(nftId);
```

### 4. Check Vesting Schedule
```typescript
const schedule = await vestingNFT.getVestingSchedule(nftId);
console.log({
    totalAmount: ethers.formatEther(schedule.totalAmount),
    startTime: new Date(Number(schedule.startTime) * 1000),
    endTime: new Date(Number(schedule.endTime) * 1000),
    claimedAmount: ethers.formatEther(schedule.claimedAmount),
    isActive: schedule.isActive
});
```

## Test Coverage

The test suite covers:
1. Token deployment and initialization
2. Instant purchase functionality
3. Vesting purchase and NFT minting
4. Vesting schedule calculations
5. Token claiming process
6. Admin functions and security
7. Edge cases and error conditions

## Security Features

- Reentrancy protection using OpenZeppelin's ReentrancyGuard
- Ownable pattern for admin functions
- Safe math operations
- Event emission for tracking
- NFT-based vesting schedule representation
- Linear vesting implementation

## License

MIT

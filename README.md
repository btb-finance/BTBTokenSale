# BTB Token Vesting with NFT

This project implements a token vesting system for the BTB Token on Optimism Sepolia. It features instant token purchases and vesting schedules represented by NFTs, offering a 50% discount for vested purchases.

## Deployed Contracts (Optimism Sepolia)

- **BTB Token**: [`0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c`](https://sepolia-optimism.etherscan.io/address/0x3Bc21B0B248A0B5CB45A6DD23f5d689fD9fd0B6c#code)
- **TokenSale**: [`0x2DE5bedF629994149F3ed4902E6189bfC60444ed`](https://sepolia-optimism.etherscan.io/address/0x2DE5bedF629994149F3ed4902E6189bfC60444ed#code)
- **VestingNFT**: [`0x785A5128EF5eF59A8c53f7f578ce24F374b3497D`](https://sepolia-optimism.etherscan.io/address/0x785A5128EF5eF59A8c53f7f578ce24F374b3497D#code)

## Latest Deployment (January 12, 2025)
- Added comprehensive error messages
- Improved security in VestingNFT contract
- Fixed potential claimed amount manipulation vulnerability

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

## Token Purchase Guide

### Instant Purchase
- Price: 0.000001 ETH per token
- Minimum purchase: 0.000001 ETH (1 token)
- No maximum limit
- Tokens received instantly
- Example purchases:
  - 0.000001 ETH = 1 token
  - 0.00001 ETH = 10 tokens
  - 0.0001 ETH = 100 tokens

### Vesting Purchase
- Price: 0.0000005 ETH per token (50% discount)
- Minimum purchase: 0.0000005 ETH (1 token)
- No maximum limit
- 12-month linear vesting
- NFT represents vesting schedule
- Example purchases:
  - 0.0000005 ETH = 1 token vested
  - 0.000005 ETH = 10 tokens vested
  - 0.00005 ETH = 100 tokens vested

### Price Calculation
The token amount is calculated proportionally to the ETH sent:
```
Token Amount = (ETH sent * 1e18) / Token Price
```
- Sending more ETH will get you proportionally more tokens
- The price per token remains constant
- All purchases are processed at the same rate

## Project Structure

```
├── contracts/
│   ├── BTBToken.sol      # ERC20 token contract
│   ├── TokenSale.sol     # Handles token sales and vesting
│   └── VestingNFT.sol    # NFT contract for vesting schedules
├── scripts/
│   ├── deploy.ts                 # Deploys and verifies all contracts
│   ├── setup-sale.ts            # Transfers tokens to sale contract
│   ├── test-deployed.ts         # Tests basic contract functionality
│   ├── test-purchases.ts        # Tests token purchases and vesting
│   ├── test-admin-withdrawals.ts # Tests admin withdrawal functions
│   ├── interact.ts              # General contract interaction script
│   └── claim-vested.ts          # Claims vested tokens
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

## Available Scripts

### Deployment
```bash
# Deploy and verify all contracts
npx hardhat run scripts/deploy.ts --network optimisticSepolia

# Setup sale contract with tokens
npx hardhat run scripts/setup-sale.ts --network optimisticSepolia
```

### Testing Deployed Contracts
```bash
# Test basic contract functionality
npx hardhat run scripts/test-deployed.ts --network optimisticSepolia

# Test token purchases and vesting
npx hardhat run scripts/test-purchases.ts --network optimisticSepolia

# Test admin withdrawals
npx hardhat run scripts/test-admin-withdrawals.ts --network optimisticSepolia
```

### User Operations
```bash
# General contract interaction
npx hardhat run scripts/interact.ts --network optimisticSepolia

# Claim vested tokens
npx hardhat run scripts/claim-vested.ts --network optimisticSepolia
```

## Script Details

### deploy.ts
- Deploys BTB Token, TokenSale, and VestingNFT contracts
- Verifies all contracts on Etherscan
- Waits 30 seconds between deployment and verification
- Outputs all contract addresses

### setup-sale.ts
- Transfers 100,000 BTB tokens to the sale contract
- Verifies token balances before and after transfer
- Required before users can purchase tokens

### test-deployed.ts
- Verifies contract connections and configurations
- Checks token prices and balances
- Tests security features
- Validates VestingNFT setup

### test-purchases.ts
- Tests instant token purchase (0.000001 ETH per token)
- Tests vesting purchase (0.0000005 ETH per token)
- Creates and validates vesting NFT
- Claims vested tokens
- Checks all balances and schedules

### test-admin-withdrawals.ts
- Tests ETH withdrawal by admin
- Tests token withdrawal by admin
- Verifies balance changes
- Checks security permissions

### interact.ts
- General-purpose interaction script
- Shows contract information
- Displays user balances
- Tests token approvals and transfers

### claim-vested.ts
- Claims available vested tokens
- Shows vesting schedule details
- Displays claimed amounts
- Updates NFT metadata

## Security Features

1. Access Control
   - Only owner can withdraw ETH and tokens
   - Only TokenSale can update vesting schedules
   - NFT ownership verification for claims

2. Vesting Protection
   - Cannot decrease claimed amounts
   - Cannot claim more than total allocation
   - Time-based linear vesting

3. Error Handling
   - Detailed error messages
   - Balance checks
   - Ownership validation

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

## License

MIT

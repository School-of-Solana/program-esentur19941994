# Project Description

**Deployed Frontend URL:** https://program-esentur19941994.vercel.app

**Solana Program ID:** FKcv5xRMK7eF3uZx5YTVchMPoGsWhcxvdjE61t8RSNew

## Project Overview

### Description

A decentralized crowdfunding platform built on Solana that allows users to create fundraising campaigns and accept contributions from the community. The platform enables campaign creators to set funding goals and deadlines, while contributors can fund campaigns they believe in. The system includes features for withdrawal of funds upon successful completion and refunds when campaigns fail to meet their targets or expire.

### Key Features

- **Campaign Creation**: Users can create crowdfunding campaigns with titles, descriptions, target amounts, and deadlines
- **Campaign Funding**: Contributors can fund active campaigns with SOL tokens
- **Automatic Deadline Management**: Campaigns automatically expire based on set deadlines
- **Fund Withdrawal**: Campaign creators can withdraw funds from successful campaigns
- **Contribution Refunds**: Contributors can get refunds for failed or expired campaigns
- **Real-time Campaign Tracking**: Live updates of campaign progress, funding amounts, and status
- **Wallet Integration**: Seamless integration with Phantom, Solflare, and other Solana wallets
- **Responsive UI**: Modern, clean interface with gradient designs and status indicators

### How to Use the dApp

1. **Connect Wallet**: Click "Connect Wallet" and connect your Phantom, Solflare, or compatible Solana wallet
2. **View Campaigns**: Browse existing crowdfunding campaigns with their progress, deadlines, and details
3. **Create Campaign**:
   - Click "Create New Campaign"
   - Fill in campaign title (max 100 characters)
   - Add detailed description (max 500 characters)
   - Set target funding amount in SOL
   - Choose deadline date
   - Submit to create your campaign
4. **Fund Campaign**:
   - Select any active campaign
   - Enter the amount you want to contribute in SOL
   - Click "Fund Campaign" to contribute
5. **Withdraw Funds**: Campaign creators can withdraw funds from successful campaigns after reaching their target
6. **Get Refunds**: Contributors can claim refunds from expired or failed campaigns

## Program Architecture

This Solana program implements a decentralized crowdfunding system using Anchor framework. The architecture consists of four main instructions that manage campaign lifecycle and contribution tracking through Program Derived Addresses (PDAs).

### PDA Usage

The program uses PDAs to create deterministic addresses for campaigns and contributions, ensuring data integrity and preventing account collisions.

**PDAs Used:**

- **Campaign PDA**: `["campaign", creator_pubkey, title_bytes]` - Creates unique campaign accounts tied to creator and title
- **Contribution PDA**: `["contribution", campaign_pubkey, contributor_pubkey]` - Tracks individual contributions per campaign

### Program Instructions

The crowdfunding program implements four core instructions for complete campaign management:

**Instructions Implemented:**

- **create_campaign**: Creates a new crowdfunding campaign with title, description, target amount, and deadline
- **fund_campaign**: Allows users to contribute SOL tokens to active campaigns
- **withdraw_funds**: Enables campaign creators to withdraw funds from successful campaigns
- **refund_contribution**: Allows contributors to claim refunds from failed or expired campaigns

### Account Structure

The program uses two main account structures to store campaign and contribution data:

```rust
#[account]
pub struct Campaign {
    pub creator: Pubkey,        // Campaign creator's wallet address
    pub title: String,          // Campaign title (max 100 chars)
    pub description: String,    // Campaign description (max 500 chars)
    pub target_amount: u64,     // Funding target in lamports
    pub current_amount: u64,    // Current funding amount in lamports
    pub deadline: i64,          // Campaign deadline timestamp
    pub created_at: i64,        // Campaign creation timestamp
    pub is_active: bool,        // Campaign status flag
}

#[account]
pub struct Contribution {
    pub contributor: Pubkey,    // Contributor's wallet address
    pub campaign: Pubkey,       // Associated campaign account
    pub amount: u64,           // Contribution amount in lamports
    pub timestamp: i64,        // Contribution timestamp
}
```

## Testing

### Test Coverage

The project includes comprehensive TypeScript tests covering both successful operations and error scenarios to ensure robust functionality and proper error handling. **All 11 tests pass successfully.**

**Happy Path Tests:**

- **Campaign Creation**: Successfully creates campaigns with valid parameters
- **Campaign Funding**: Contributors can fund active campaigns with proper validation
- **Multiple Contributors**: Successfully handles multiple contributors to the same campaign
- **Fund Withdrawal**: Creators can withdraw funds when campaign target is reached
- **Contribution Refunds**: Contributors can get refunds when campaigns fail or expire

**Unhappy Path Tests:**

- **Title Length Validation**: Prevents creation of campaigns with titles exceeding 100 characters
- **Invalid Target Amount**: Rejects campaigns with zero or negative target amounts
- **Invalid Deadline**: Prevents campaigns with deadlines in the past
- **Invalid Funding Amount**: Rejects funding attempts with invalid amounts
- **Unauthorized Withdrawal**: Prevents non-creators from withdrawing campaign funds
- **Unauthorized Refunds**: Prevents wrong contributors from claiming others' refunds

### Running Tests

```bash
# Navigate to anchor project directory
cd anchor_project/crowdfunding

# Run all tests
anchor test

# Run tests with detailed output
anchor test --verbose
```

### Additional Notes for Evaluators

- **Frontend URL**: The frontend is built with React 19, TypeScript, and TailwindCSS for a modern user experience
- **Network**: Program deployed on Solana Devnet for testing and evaluation
- **Wallet Support**: Compatible with Phantom, Solflare, and other Solana wallets through @solana/wallet-adapter
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Real-time Updates**: UI updates automatically when campaigns are funded or created
- **Responsive Design**: Mobile-friendly interface with gradient styling and status indicators
- **Build Process**: Uses Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript implementation for both frontend and program interactions
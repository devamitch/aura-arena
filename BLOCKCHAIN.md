# Aura Arena — Blockchain Integration Guide

> **Goal:** Add on-chain rewards, NFT achievements, AURA token, and verifiable game scores to Aura Arena — completely free on testnets, with a clear path to mainnet.

---

## Which Chain? Ethereum vs Solana

| | **Solana** | **Ethereum (+ L2s)** |
|-|-----------|----------------------|
| **Speed** | 65,000 TPS, 400ms finality | Ethereum: 15 TPS; L2s: 2,000+ TPS |
| **Cost per tx** | $0.00025 | Ethereum: $2–20; Base/Arbitrum: $0.001 |
| **Gaming ecosystem** | ✅ Strong (STEPN, Star Atlas) | ✅ Massive (Axie, Gods Unchained) |
| **Free testnet** | Solana Devnet (unlimited SOL) | Sepolia testnet (free ETH) |
| **NFT standard** | Metaplex Core / Token Metadata | ERC-721 / ERC-1155 |
| **Smart contracts** | Rust (Anchor) or Python (Seahorse) | Solidity (Hardhat/Foundry) |
| **Wallet** | Phantom, Backpack | MetaMask, Coinbase Wallet |
| **Learn curve** | Medium | Low (more tutorials) |

### Recommendation for Aura Arena

**→ Start with Ethereum L2 (Base or Arbitrum)** for your first MVP:
- Solidity is easier to learn than Rust
- More developer resources and Stack Overflow answers
- Transactions cost $0.001 on Base (Coinbase's L2)
- Eventually bridge to Solana once you're comfortable

**→ Add Solana** for the token/coin (faster, cheaper for microtransactions)

---

## Part 1: Ethereum L2 — AURA Token + NFT Achievements

### Setup

```bash
mkdir aura-contracts && cd aura-contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
npx hardhat init  # Choose "TypeScript project"
```

### AURA Token (ERC-20)

```solidity
// contracts/AuraToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuraToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B AURA
    address public gameContract;  // Only game can mint rewards

    event GameContractSet(address indexed gameContract);
    event RewardMinted(address indexed player, uint256 amount, string reason);

    constructor() ERC20("Aura Token", "AURA") Ownable(msg.sender) {
        // Mint 10M to treasury for initial liquidity
        _mint(msg.sender, 10_000_000 * 10**18);
    }

    function setGameContract(address _game) external onlyOwner {
        gameContract = _game;
        emit GameContractSet(_game);
    }

    // Called by game server after session completion
    function rewardPlayer(address player, uint256 amount, string calldata reason)
        external
    {
        require(msg.sender == gameContract, "Only game contract");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(player, amount);
        emit RewardMinted(player, amount, reason);
    }

    // Burn tokens (used for premium features, staking)
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
```

### NFT Achievements (ERC-1155 — one contract, many achievement types)

```solidity
// contracts/AuraAchievements.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuraAchievements is ERC1155, Ownable {
    address public gameContract;

    // Achievement IDs match constants/gamification.ts achievement IDs
    mapping(string => uint256) public achievementIds;
    mapping(uint256 => string) public achievementNames;
    mapping(uint256 => string) public achievementMetadata; // IPFS URI
    uint256 public nextId = 1;

    event AchievementUnlocked(address indexed player, string achievementId, uint256 tokenId);

    constructor() ERC1155("") Ownable(msg.sender) {}

    function setGameContract(address _game) external onlyOwner {
        gameContract = _game;
    }

    function registerAchievement(string calldata achievementId, string calldata name, string calldata ipfsUri)
        external onlyOwner
    {
        achievementIds[achievementId] = nextId;
        achievementNames[nextId] = name;
        achievementMetadata[nextId] = ipfsUri;
        nextId++;
    }

    // Called when player unlocks achievement in game
    function mintAchievement(address player, string calldata achievementId)
        external
    {
        require(msg.sender == gameContract, "Only game");
        uint256 tokenId = achievementIds[achievementId];
        require(tokenId != 0, "Achievement not registered");
        require(balanceOf(player, tokenId) == 0, "Already earned");

        _mint(player, tokenId, 1, "");
        emit AchievementUnlocked(player, achievementId, tokenId);
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return achievementMetadata[tokenId];
    }
}
```

### Game Contract (Session Rewards)

```solidity
// contracts/AuraGame.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AuraToken.sol";
import "./AuraAchievements.sol";

contract AuraGame is Ownable {
    AuraToken public token;
    AuraAchievements public achievements;

    // Rate: 1 XP = 0.001 AURA token (adjust for tokenomics)
    uint256 public constant XP_TO_AURA_RATE = 1e15; // 0.001 AURA per XP

    // Session signatures (prevent replay attacks)
    mapping(bytes32 => bool) public usedSessionIds;

    event SessionRewarded(address indexed player, uint256 xp, uint256 auraAmount);
    event BattleRewarded(address indexed winner, address indexed loser, uint256 stake);

    constructor(address _token, address _achievements) Ownable(msg.sender) {
        token = AuraToken(_token);
        achievements = AuraAchievements(_achievements);
    }

    // Player calls this after completing a session (signed by backend)
    function claimSessionReward(
        uint256 xpEarned,
        bytes32 sessionId,
        bytes calldata signature  // Backend signs to prevent cheating
    ) external {
        require(!usedSessionIds[sessionId], "Already claimed");
        require(_verifySignature(msg.sender, xpEarned, sessionId, signature), "Invalid signature");

        usedSessionIds[sessionId] = true;
        uint256 auraAmount = xpEarned * XP_TO_AURA_RATE;
        token.rewardPlayer(msg.sender, auraAmount, "session_complete");
        emit SessionRewarded(msg.sender, xpEarned, auraAmount);
    }

    function _verifySignature(address player, uint256 xp, bytes32 sessionId, bytes calldata sig)
        internal view returns (bool)
    {
        bytes32 hash = keccak256(abi.encodePacked(player, xp, sessionId));
        bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        // Recover signer and compare to backend wallet (stored as owner or separate signer)
        return _recoverSigner(ethHash, sig) == owner();
    }

    function _recoverSigner(bytes32 hash, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "Invalid signature length");
        bytes32 r; bytes32 s; uint8 v;
        assembly { r := mload(add(sig, 32)); s := mload(add(sig, 64)); v := byte(0, mload(add(sig, 96))) }
        return ecrecover(hash, v, r, s);
    }
}
```

### Deploy to Sepolia Testnet (Free)

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    base_sepolia: {
      url: "https://sepolia.base.org",  // Free, no API key needed
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
};
export default config;
```

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const AuraToken = await ethers.deployContract("AuraToken");
  await AuraToken.waitForDeployment();
  console.log("AuraToken:", await AuraToken.getAddress());

  const AuraAchievements = await ethers.deployContract("AuraAchievements");
  await AuraAchievements.waitForDeployment();
  console.log("AuraAchievements:", await AuraAchievements.getAddress());

  const AuraGame = await ethers.deployContract("AuraGame", [
    await AuraToken.getAddress(),
    await AuraAchievements.getAddress()
  ]);
  await AuraGame.waitForDeployment();
  console.log("AuraGame:", await AuraGame.getAddress());

  // Wire up contracts
  await AuraToken.setGameContract(await AuraGame.getAddress());
  await AuraAchievements.setGameContract(await AuraGame.getAddress());
  console.log("✅ Contracts wired up!");
}

main().catch(console.error);
```

```bash
# Get free Sepolia ETH: https://sepoliafaucet.com
# Get free Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

npx hardhat run scripts/deploy.ts --network base_sepolia
```

### Frontend Integration

```bash
npm install ethers wagmi viem @rainbow-me/rainbowkit
```

```typescript
// src/hooks/useBlockchain.ts
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseAbi } from "viem";

const AURA_TOKEN_ADDRESS = "0x..."; // After deployment
const ACHIEVEMENTS_ADDRESS = "0x...";

export const useAuraBalance = () => {
  const { address } = useAccount();
  return useReadContract({
    address: AURA_TOKEN_ADDRESS,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [address!],
  });
};

export const useClaimReward = () => {
  const { writeContractAsync } = useWriteContract();

  const claimSessionReward = async (xpEarned: number, sessionId: string, signature: string) => {
    return writeContractAsync({
      address: AURA_TOKEN_ADDRESS,
      abi: parseAbi(["function claimSessionReward(uint256,bytes32,bytes) external"]),
      functionName: "claimSessionReward",
      args: [BigInt(xpEarned), sessionId as `0x${string}`, signature as `0x${string}`],
    });
  };

  return { claimSessionReward };
};
```

---

## Part 2: Solana — AURA Coin (Custom SPL Token)

Solana is better for the actual in-game currency (micro-transactions, fast settlement).

### Setup

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
solana config set --url devnet  # Free devnet

# Airdrop free SOL for testing
solana airdrop 5  # Gets 5 SOL on devnet (free, unlimited)
solana balance

# Install Anchor (Solana's framework)
cargo install --git https://github.com/coral-xyz/anchor anchor-cli
```

### Create AURA SPL Token (No Code Needed for Basic Token)

```bash
# Create the token mint
spl-token create-token --decimals 6
# → Token: AuRAxxx...  (save this address!)

# Create token account for your wallet
spl-token create-account AuRAxxx...

# Mint initial supply (1 billion AURA)
spl-token mint AuRAxxx... 1000000000

# Disable minting (optional — makes it deflationary)
spl-token authorize AuRAxxx... mint --disable
```

### Anchor Smart Contract for Game Logic

```rust
// programs/aura-game/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AuRaGaMeXxx...");

#[program]
pub mod aura_game {
    use super::*;

    // Initialize player account
    pub fn initialize_player(ctx: Context<InitializePlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player_account;
        player.authority = ctx.accounts.user.key();
        player.xp = 0;
        player.sessions = 0;
        player.pve_wins = 0;
        Ok(())
    }

    // Record session and reward AURA tokens
    pub fn complete_session(
        ctx: Context<CompleteSession>,
        score: u64,
        difficulty: u8,
        session_id: [u8; 32],
    ) -> Result<()> {
        let player = &mut ctx.accounts.player_account;

        // Anti-cheat: score must be 0-100
        require!(score <= 100, AuraError::InvalidScore);

        // Calculate XP
        let xp_gained = score * difficulty as u64;
        player.xp += xp_gained;
        player.sessions += 1;

        // Calculate AURA reward: 1 AURA = 1000 XP points
        let aura_amount = xp_gained * 1_000; // 0.001 AURA per XP (6 decimals)

        // Transfer AURA from game treasury to player
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.treasury_token_account.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.treasury_authority.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, aura_amount)?;

        emit!(SessionCompleted {
            player: ctx.accounts.user.key(),
            score,
            xp_gained,
            aura_rewarded: aura_amount,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CompleteSession<'info> {
    #[account(mut, seeds = [b"player", user.key().as_ref()], bump)]
    pub player_account: Account<'info, PlayerAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,
    /// CHECK: Treasury PDA
    pub treasury_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct PlayerAccount {
    pub authority: Pubkey,
    pub xp: u64,
    pub sessions: u64,
    pub pve_wins: u64,
}

#[event]
pub struct SessionCompleted {
    pub player: Pubkey,
    pub score: u64,
    pub xp_gained: u64,
    pub aura_rewarded: u64,
}

#[error_code]
pub enum AuraError {
    #[msg("Score must be between 0 and 100")]
    InvalidScore,
}
```

### Deploy to Solana Devnet (Free)

```bash
anchor build
anchor deploy --provider.cluster devnet
# Your program ID will be printed — save it!
```

### Solana NFT Achievements with Metaplex

```bash
npm install @metaplex-foundation/mpl-core @metaplex-foundation/umi
```

```typescript
// src/lib/solana.ts
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, mplCore } from "@metaplex-foundation/mpl-core";
import { createSignerFromKeypair, signerIdentity, generateSigner } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useWallet } from "@solana/wallet-adapter-react";

export const mintAchievementNFT = async (
  wallet: any,
  achievementName: string,
  achievementImageUri: string
) => {
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplCore())
    .use(walletAdapterIdentity(wallet));

  const assetSigner = generateSigner(umi);

  await createV1(umi, {
    asset: assetSigner,
    name: `Aura Arena: ${achievementName}`,
    uri: achievementImageUri,  // IPFS or Arweave link
    plugins: [
      {
        type: "FreezeDelegate",  // Non-transferable achievement
        frozen: true,
        authority: { type: "Owner" }
      }
    ]
  }).sendAndConfirm(umi);

  return assetSigner.publicKey;
};
```

---

## Free Tools & Resources

### Get Free Testnet Tokens

| Network | Faucet | Amount |
|---------|--------|--------|
| Ethereum Sepolia | https://sepoliafaucet.com | 0.5 ETH/day |
| Base Sepolia | https://faucet.quicknode.com/base/sepolia | 0.01 ETH/day |
| Solana Devnet | `solana airdrop 5` | 5 SOL/day (CLI) |

### Free Developer Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **Hardhat** | Ethereum development | Free forever |
| **Foundry** | Faster Ethereum testing | Free |
| **Anchor** | Solana framework | Free |
| **Solana Playground** | Browser-based IDE | Free |
| **Remix IDE** | Browser Solidity IDE | Free |
| **OpenZeppelin Wizard** | Generate contract code | Free |
| **Metaplex** | Solana NFT tools | Free |
| **IPFS / Pinata** | Store NFT metadata | 1GB free |
| **Etherscan** | Contract explorer | Free API |

### Free Infra (No API Key Needed)

```typescript
// Public RPC endpoints — no key needed (rate limited)
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";
const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
const ETHEREUM_SEPOLIA = "https://ethereum-sepolia-rpc.publicnode.com";

// For production: Alchemy free tier (300M compute units/month)
// or QuickNode free tier (10M credits/month)
```

---

## Tokenomics Design for Aura Arena

### AURA Token Distribution

```
Total Supply: 1,000,000,000 AURA

├── 40% — Player Rewards (play-to-earn over 5 years)
├── 20% — Team & Development (4-year vest)
├── 15% — Ecosystem Fund (partnerships, grants)
├── 15% — Treasury (liquidity, operations)
└── 10% — Community Airdrop (early adopters)
```

### In-Game Economy

| Action | AURA Earned | AURA Spent |
|--------|------------|------------|
| Complete session (diff 1) | 5–50 AURA | — |
| Win PvE battle | 100–500 AURA | — |
| Win Live battle | 200–1000 AURA | — |
| 7-day streak | 250 AURA bonus | — |
| Unlock premium drill | — | 500 AURA |
| Premium coach skin | — | 1,000 AURA |
| Enter tournament | — | 200 AURA |
| Stake for multiplier | — | Lock 5,000 AURA |

---

## Integration Roadmap

### Phase 1: Testnet (Free, Now)
- [ ] Deploy AURA token to Base Sepolia
- [ ] Deploy Achievement NFT contract
- [ ] Add "Connect Wallet" button to ProfilePage
- [ ] Show on-chain AURA balance alongside in-app XP
- [ ] Mint achievement NFT when player unlocks first achievement

### Phase 2: Hybrid (Free → Paid)
- [ ] Backend signs session results to prevent cheating
- [ ] Player claims AURA rewards from game contract
- [ ] Achievement NFTs minted on unlock
- [ ] Basic leaderboard uses on-chain data

### Phase 3: Mainnet (Requires Real Funds)
- [ ] Audit contracts (use free audit tools: Slither, MythX free tier)
- [ ] Deploy to Base mainnet (~$50 deployment)
- [ ] List AURA on DEX (Uniswap v3 — needs liquidity)
- [ ] Enable tournament staking

---

## Minimal "Connect Wallet" UI

```tsx
// src/features/blockchain/WalletButton.tsx
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";

export const WalletButton = () => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 rounded-xl text-xs font-mono"
        style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", color: "var(--ac)" }}
      >
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="px-3 py-1.5 rounded-xl text-xs font-bold"
      style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.25)", color: "var(--ac)" }}
    >
      Connect Wallet
    </button>
  );
};
```

---

## Learning Path

1. **Week 1:** Solidity basics → CryptoZombies.io (free, interactive)
2. **Week 2:** Deploy ERC-20 → OpenZeppelin Wizard + Remix IDE
3. **Week 3:** Hardhat testing → Hardhat tutorial (hardhat.org)
4. **Week 4:** Deploy to Base Sepolia + connect wagmi to frontend
5. **Month 2:** Learn Anchor for Solana → anchor-lang.com/docs

### Best Free Resources

- **CryptoZombies** (cryptozombies.io) — Learn Solidity by making a game
- **Speedrun Ethereum** (speedrunethereum.com) — Scaffold-ETH challenges
- **Anchor Book** (book.anchor-lang.com) — Solana/Rust contracts
- **Solana Cookbook** (solanacookbook.com) — Code recipes
- **Buildspace** (buildspace.so) — Free cohort-based courses
- **LearnWeb3** (learnweb3.io) — Full curriculum, free

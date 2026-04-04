# Storylock

> Write together. Sealed forever.

A Solana-powered collaborative writing platform where creators and their subscribers co-author content paragraph by paragraph, with every vote and winning contribution permanently sealed on-chain.

---

## What it does

A creator starts a piece — a blog post, script, or story — and opens it to their inner circle. Subscribers submit the next paragraph. The community votes. The winner is locked on Solana forever, with the contributor's wallet address as co-author. Repeat until the piece is complete.

## How it works

1. **Creator** writes the opening paragraph and opens a round
2. **Tier 1 subscribers** submit candidate paragraphs (burns a contribution token)
3. **Tier 1 + 2 subscribers** vote on their favourite (burns a vote token)
4. **Winning paragraph** is sealed on-chain — immutable, timestamped, attributed
5. Repeat for the next paragraph

Tokens are non-financial access credentials issued by the creator to privileged subscribers. No staking, no rewards, no crypto knowledge required.

## Tech stack

| Layer | Tech |
|---|---|
| Blockchain | Solana |
| Smart contracts | Anchor (Rust) |
| Tokens | SPL Token (transfer disabled) |
| Paragraph storage | Arweave (hash on-chain) |
| Backend | Node.js |
| Frontend | React + Solana Wallet Adapter |

## Getting started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy contracts (devnet)
anchor build && anchor deploy
```

## Docs

See [`storylock-product-spec.md`](./storylock-product-spec.md) for full product spec, smart contract design, and architecture.

---

Built for the Solana Hackathon — Best Use of Solana track.

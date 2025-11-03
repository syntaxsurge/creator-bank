# CreatorBank Demo Video Script

This script walks through every core feature required for the Mezo hackathon submission. It is written for a 7–8 minute YouTube demo that balances storytelling with on-screen walkthroughs.

---

## Segment 1 – Hook & Mission (0:00 – 0:40)

1. **Narration:** “Welcome to CreatorBank, the Bitcoin-native finance stack for creators building on Mezo. In the next few minutes I’ll show how we turn BTC collateral into day-to-day money flows using MUSD.”
2. **On-screen:** Landing page hero (`/`) with CreatorBank logo, quick scroll to highlight value props.
3. **Call-out:** Mention Mezo Passport support and that every payment settles in MUSD on chain.

## Segment 2 – Connect & Wallet Overview (0:40 – 1:30)

1. **Action:** Click the `Connect wallet` button in the navbar.
2. **Narration:** “CreatorBank ships with Mezo Passport by default, so Bitcoin-native wallets like Xverse show up next to RainbowKit favourites.”
3. **On-screen:** After connecting, point to the balance/network badges in the header. Mention live MUSD balance polling via viem.
4. **Optional:** Toggle theme to show minimal UI polish.

## Segment 3 – Payments Dashboard Tour (1:30 – 3:20)

Navigate to `/payments`.

1. **Status overview**
   - Point to the health banner at the top.
   - Narrate how it pings both Mezo Testnet/Mainnet RPCs plus the Pyth BTC→USD and MUSD→USD feeds, flagging staleness.
2. **SatsPay Links tab**
   - Create a new handle (`creatorbankdemo`) with title/description.
   - Copy the generated link and show the transaction list placeholder.
3. **Get MUSD tab**
   - Emphasise the “bridge & mint” checklist and the deep link to the Mezo testnet hub.
   - Note that swap/borrow experiences are intentionally out-of-scope for this build.
4. **Invoices tab**
   - Issue an invoice with two line items, select the SatsPay handle from the dropdown, and submit.
   - Copy the share link (points to `/pay/<handle>?invoice=…&amount=…`).
5. **Recurring Payouts tab**
   - Set up a payout schedule with two collaborators and custom basis points.
   - Narrate that it calls the on-chain split router to push MUSD in a single click.
6. **Save Goals tab**
   - Create a “Equipment Fund” goal, earmark a portion of recent receipts.
   - Describe how it stays off-chain for labelling but cross-references on-chain transfers.

## Segment 4 – Pay Handle & Live Checkout (3:20 – 4:40)

1. **Open** a new tab with `/pay/creatorbankdemo`.
   - Narrate the QR + share link and how it watches Transfer logs for a specific recipient/token.
2. **Trigger sync**
   - In Convex dashboard (optional) or via the UI, run “Sync receipts”.
3. **Demo Shop**
   - Switch to `/shop/creatorbankdemo`.
   - Add a couple of catalog items, click “Checkout with MUSD”.
   - Highlight the right panel waiting for the chain confirmation via `PayPageClient`.
   - Narrate how once the wallet signs and the payment confirms, the UI flips to “Paid” automatically.

## Segment 5 – Membership Marketplace (4:40 – 5:30)

Navigate to `/marketplace`.

1. **Show** an available group.
2. **Narration:** “Memberships mint through `MembershipPass1155`, but settlement is MUSD via `MembershipMarketplace`.”
3. **Action:** Purchase a pass (approve if needed) and highlight on-screen confirmation plus the balance change badge in the navbar.
4. **Optional:** Show secondary listing creation to underline ERC-20 settlement for peer-to-peer trades.

## Segment 6 – Group Experience & Collaborator Tools (5:30 – 6:40)

1. **Visit** the group you just joined (`/creator-group-id/about` as applicable).
2. **Narrate:** call out classroom, feed, and members tabs running through Convex.
3. **Open** the group settings form to show how pricing, collaborators, and registrar sync reuse the chain preference + MUSD configuration.
4. **Highlight:** Recurring payouts pull from the same collaborator list, keeping Financial Access and Daily Bitcoin tracks aligned.

## Segment 7 – Closing & Call to Action (6:40 – 7:20)

1. **Return** to `/payments` status tab.
2. **Narration:** Summarise the loop — Passport onboarding → MUSD flows (paylinks, invoices, payouts, goals) → Marketplace memberships.
3. **Call-to-action:** Invite builders to clone CreatorBank, bridge testnet BTC via the hub, and submit their own creator banks to Mezo.

---

### Recording Tips

- Keep wallet pop-ups visible when approving MUSD amounts so judges see on-chain settlement.
- Run `pnpm convex:dev` and `pnpm dev` locally for low-latency polling on the pay pages.
- Have test MUSD ready on Mezo Testnet to avoid delays during the checkout demonstration.
- If a transaction takes longer than expected, cut to a prepared clip of the “Paid” state to keep pacing tight.


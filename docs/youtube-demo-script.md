# CreatorBank Demo Video Script

This script walks through every core feature required for the Mezo hackathon submission. It is written for a 7–8 minute YouTube demo that balances storytelling with on-screen walkthroughs.

---

## Segment 1 – Hook & Mission (0:00 – 0:40)

1. **On-screen:** Land on the homepage hero (`/`) with the CreatorBank logo and tagline framed center.
   - **Voice-over:** “Welcome to CreatorBank, the Bitcoin-native finance stack for creators building on Mezo. In the next few minutes I’ll show how we turn BTC collateral into day-to-day money flows using MUSD.”
2. **On-screen:** Slowly scroll through the value props, pausing on the Passport and MUSD settlement badges.
   - **Voice-over:** “Every workflow here leans on Mezo Passport, and every payment settles trustlessly in MUSD so creators stay in control.”

## Segment 2 – Connect & Wallet Overview (0:40 – 1:30)

1. **Action:** Click the `Connect wallet` button in the navbar.
   - **Voice-over:** “Let’s connect a wallet. CreatorBank ships with Passport, so every Mezo-ready wallet is just a click away.”
2. **On-screen:** Keep the Passport modal visible showing Xverse, Leather, and RainbowKit options.
   - **Voice-over:** “CreatorBank ships with Mezo Passport by default, so Bitcoin-native wallets like Xverse show up next to RainbowKit favourites.”
3. **On-screen:** After connecting, point to the balance/network badges in the header. Mention live MUSD balance polling via viem.
   - **Voice-over:** “Once connected, the header lights up with my active chain and live MUSD balance, all pulled through viem in real time.”
4. **Optional:** Toggle theme to show minimal UI polish.
   - **Voice-over:** “Dark mode is one tap away thanks to the shared theme provider—small touches, big polish.”

## Segment 3 – Payments Dashboard Tour (1:30 – 3:20)

Navigate to `/payments`.

1. **Status overview**
   - Point to the health banner at the top.
   - Explain how it pings both Mezo Testnet/Mainnet RPCs plus the Pyth BTC→USD and MUSD→USD feeds, flagging staleness.
   - **Voice-over:** “Up top, a live status panel watches Mezo testnet and mainnet RPCs, plus Pyth price feeds for BTC and MUSD. If anything lags, this banner calls it out before creators feel the pain.”
2. **SatsPay Links tab**
   - Create a new handle (`creatorbankdemo`) with title/description.
   - Copy the generated link and show the transaction list placeholder.
   - **Voice-over:** “SatsPay Links turn any handle into a payable URL. I’ll claim `creatorbankdemo`, drop in a description, and CreatorBank immediately hands me a shareable link and live receipt list.”
3. **Get MUSD tab**
   - Emphasise the “bridge & mint” checklist and the deep link to the Mezo testnet hub.
   - Note that swap/borrow experiences are intentionally out-of-scope for this build.
   - **Voice-over:** “Need MUSD fast? The Get MUSD tab funnels you straight to Mezo’s swap and borrow flows. CreatorBank keeps liquidity off-platform so we stay lean, but every guide you need is a click away.”
4. **Invoices tab**
   - Issue an invoice with two line items, select the SatsPay handle from the dropdown, and submit.
   - Copy the share link (points to `/pay/<handle>?invoice=…&amount=…`).
   - **Voice-over:** “Invoices are just as quick. Two line items, tie it back to the same handle, and CreatorBank outputs a payment URL that settles straight to MUSD on chain.”
5. **Recurring Payouts tab**
   - Set up a payout schedule with two collaborators and custom basis points.
   - Mention that it calls the on-chain split router to push MUSD in a single click.
   - **Voice-over:** “Recurring payouts keep collaborators happy. Define the split once, and behind the scenes we call the split router to push MUSD to every wallet in one transaction.”
6. **Save Goals tab**
   - Create a “Equipment Fund” goal, earmark a portion of recent receipts.
   - Describe how it stays off-chain for labelling but cross-references on-chain transfers.
   - **Voice-over:** “Save Goals let creators earmark revenue without touching custody. CreatorBank maps labels to on-chain transfers so books stay clean and flexible.”

## Segment 4 – Pay Handle & Live Checkout (3:20 – 4:40)

1. **Open** a new tab with `/pay/creatorbankdemo`.
   - Explain the QR + share link and how it watches Transfer logs for a specific recipient/token.
   - **Voice-over:** “Here’s the public checkout. Every pay page listens for MUSD transfers to this handle, and the QR code drops you directly into the wallet flow.”
2. **Trigger sync**
   - In Convex dashboard (optional) or via the UI, run “Sync receipts”.
   - **Voice-over:** “If you want to double check, hit Sync Receipts and CreatorBank reconciles the latest transfers from Convex instantly.”
3. **Demo Shop**
   - Switch to `/shop/creatorbankdemo`.
   - Add a couple of catalog items, click “Checkout with MUSD”.
   - Highlight the right panel waiting for the chain confirmation via `PayPageClient`.
   - Explain how once the wallet signs and the payment confirms, the UI flips to “Paid” automatically.
   - **Voice-over:** “The same handle powers a storefront. I’ll add a few items, hit checkout, and watch the right panel switch states the moment the MUSD transfer hits the chain.”

## Segment 5 – Membership Marketplace (4:40 – 5:30)

Navigate to `/marketplace`.

1. **Show** an available group.
   - **Voice-over:** “The marketplace lists every membership my wallet can mint right now.”
2. **On-screen:** Hover the info tooltip next to the listing price to reveal the on-chain contract summary.
   - **Voice-over:** “Memberships mint through `MembershipPass1155`, but settlement is MUSD via `MembershipMarketplace`.”
3. **Action:** Purchase a pass (approve if needed) and highlight on-screen confirmation plus the balance change badge in the navbar.
   - **Voice-over:** “I’ll mint one—approve once, confirm the swap, and CreatorBank updates my balance badge the second the MUSD leaves my wallet.”
4. **Optional:** Show secondary listing creation to underline ERC-20 settlement for peer-to-peer trades.
   - **Voice-over:** “Secondary listings reuse the same ERC-20 rails, so peer-to-peer trades feel native.”

## Segment 6 – Group Experience & Collaborator Tools (5:30 – 6:40)

1. **Visit** the group you just joined (`/creator-group-id/about` as applicable).
   - **Voice-over:** “Inside the group, everything is gated automatically because the NFT lives on the same chain we’ve been using all along.”
2. **Call-out:** Highlight classroom, feed, and members tabs running through Convex.
   - **Voice-over:** “The classroom, feed, and members tabs all run through Convex, so every update stays in sync without extra backends.”
3. **Open** the group settings form to show how pricing, collaborators, and registrar sync reuse the chain preference + MUSD configuration.
   - **Voice-over:** “Organisers manage pricing, collaborators, and registrar wiring without leaving the app—CreatorBank reuses the same chain preference and MUSD contract config everywhere.”
4. **Highlight:** Recurring payouts pull from the same collaborator list, keeping Financial Access and Daily Bitcoin tracks aligned.
   - **Voice-over:** “Those collaborator splits show up again in payouts, so creators ship content and share revenue without reinventing their stack.”

## Segment 7 – Closing & Call to Action (6:40 – 7:20)

1. **Return** to `/payments` status tab.
   - **Voice-over:** “Back on the payments dashboard, everything we touched—from paylinks to memberships—feeds into this single health view.”
2. **On-screen:** Display a quick recap overlay (Passport > Payments > Marketplace) while scrubbing through captured highlights.
   - **Voice-over:** “Passport onboarding → MUSD flows for paylinks, invoices, payouts, and goals → Marketplace memberships.”
3. **Call-to-action:** Invite builders to clone CreatorBank, bridge testnet BTC via the hub, and submit their own creator banks to Mezo.
   - **Voice-over:** “Clone CreatorBank, bridge a little testnet BTC through the Mezo hub, and show us what your creator bank looks like on Mezo.”

---

### Recording Tips

- Keep wallet pop-ups visible when approving MUSD amounts so judges see on-chain settlement.
- Run `pnpm convex:dev` and `pnpm dev` locally for low-latency polling on the pay pages.
- Have test MUSD ready on Mezo Testnet to avoid delays during the checkout demonstration.
- If a transaction takes longer than expected, cut to a prepared clip of the “Paid” state to keep pacing tight.

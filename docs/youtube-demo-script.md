# CreatorBank Demo Video Script

This script outlines a 7–8 minute walkthrough of CreatorBank on the Mezo network. Each voice-over line is paired with the visual or interaction the audience should see at that moment.

---

## Segment 1 – Ecosystem Intro (00:00 – 00:10)

1. **On-screen:** Start on the CreatorBank landing hero (`/`), slowly pan across the headline, feature cards, and primary CTA.
   - **Voice-over:** “CreatorBank helps creators launch paid communities, teach members, and manage revenue on the Mezo network, so every flow stays Bitcoin-aligned.”

## Segment 2 – Connect Wallet & Network Choice (00:10 – 00:40)

1. **On-screen:** Click `Connect wallet` in the navbar to open the Passport modal.
   - **Voice-over:** “Let’s connect a wallet through Passport—RainbowKit favourites.”
2. **On-screen:** Choose RainbowKit → MetaMask (or an equivalent EVM wallet) and confirm the connection; highlight the address and balance displayed in the header.
   - **Voice-over:** “MetaMask connects instantly. The header now shows my active chain and MUSD balance.”

## Segment 3 – Payments Dashboard Tour (00:40 – 02:15)

1. **On-screen:** Navigate to `/payments`; the overview banner renders at the top.
   - **Voice-over:** “The payments dashboard is the command center—status, links, invoices, payouts, and goals in one place.”
2. **On-screen:** Point to the status banner and then click the `Status` tab; show RPC health and Pyth feed freshness.
   - **Voice-over:** “CreatorBank polls Mezo Testnet/Mainnet RPCs and the Pyth BTC→USD and MUSD→USD feeds, flagging any staleness.”
3. **On-screen:** Open the `SatsPay Links` tab, create a handle (e.g., `creatorbankdemo`), and copy the generated pay URL.
   - **Voice-over:** “SatsPay Links turn any handle into a payable URL—perfect for donations or one‑off sales.”
4. **On-screen:** Open the `Get MUSD` tab and reveal the Mezo testnet hub buttons for Swap and Borrow.
   - **Voice-over:** “When a wallet needs funds, the Get MUSD tab deep‑links to the Mezo hub’s swap and borrow flows.”
5. **On-screen:** Open the `Invoices` tab, add two line items, tie it to the SatsPay handle, and click Issue.
   - **Voice-over:** “Invoices settle in MUSD with a shareable link that points the payer straight to checkout.”
6. **On-screen:** Open `Recurring Payouts`, add two collaborators with basis points, and save.
   - **Voice-over:** “Payout schedules use the split router to push MUSD to each wallet in one transaction.”
7. **On-screen:** Open `Save Goals`, create an “Equipment Fund”, assign a percentage of receipts, and save.
   - **Voice-over:** “Save Goals earmark revenue for priorities while keeping funds in your own wallet.”

## Segment 4 – Pay Handle & Live Checkout (02:15 – 02:55)

1. **On-screen:** Open a new tab with `/pay/creatorbankdemo`; show the QR and the share link.
   - **Voice-over:** “Every pay page listens for MUSD transfers to the target handle—scan the QR or use the link.”
2. **On-screen:** Click `Sync receipts` (if visible) or wait for auto‑detection and show the confirmation state.
   - **Voice-over:** “CreatorBank watches transfer logs for the right recipient and token, flipping to Paid the moment the chain confirms.”

## Segment 5 – Create a Paid Community (03:20 – 04:10)

1. **On-screen:** Navigate to `/create` with the connected wallet; show the pricing card quoting the monthly platform fee in MUSD.
   - **Voice-over:** “The create flow quotes the monthly platform fee in MUSD so creators know the exact cost upfront.”
2. **On-screen:** Fill in sample details (name, tagline, description, pricing, media). Attempt to submit while the wallet has zero MUSD; capture the toast or banner warning about insufficient balance.
   - **Voice-over:** “With no MUSD in this wallet, the submission fails—CreatorBank blocks the transaction before it ever hits chain.”
3. **On-screen:** Open the Header `Get MUSD` button or the Payments dashboard `Get MUSD` tab in a new tab, reveal the Mezo testnet hub swap/borrow link.
   - **Voice-over:** “Funding is a click away: the Get MUSD shortcut opens Mezo’s testnet hub so creators can bridge, swap, or borrow test liquidity.”
4. **On-screen:** Return after funding, resubmit the create form, approve the MUSD spend, and confirm the MetaMask transaction. Show the success confirmation and redirect into the new community dashboard.
   - **Voice-over:** “Once the wallet holds enough MUSD, the contract call succeeds, registering the community on Mezo and seeding its dashboard.”

## Segment 6 – About, Verify, Edit Details (04:10 – 04:55)

1. **On-screen:** Land on the group About tab that displays the course ID and membership summary.
   - **Voice-over:** “The About tab exposes the on-chain course ID alongside membership details for quick auditing.”
2. **On-screen:** Click `View on Mezo Explorer` (or equivalent link) to open the course on the block explorer in a new tab.
   - **Voice-over:** “One click jumps to the Mezo explorer so anyone can verify the contract state.”
3. **On-screen:** Open `Edit group details`, scroll the platform subscription card, click `Renew subscription` (confirm if needed), then update description, tagline, pricing sliders, thumbnail, intro video URL, tags, About fields, and add collaborators with revenue splits; save and return.
   - **Voice-over:** “Renew the platform subscription, update pricing and content, and define collaborator splits—CreatorBank applies changes instantly.”
4. **On-screen:** In the Membership course panel, click `Register on‑chain` (or `Retry registration`) to sync the course with Registrar; if needed, click `Reset course ID` then register again.
   - **Voice-over:** “If a course isn’t registered yet, a single click wires it on‑chain through the Registrar so paid memberships and listings can activate.”

## Segment 7 – Classroom: Create Course, Modules, Lessons (04:55 – 05:35)

1. **On-screen:** Switch to the Classroom tab and click `Create a course`.
   - **Voice-over:** “Each community can bundle structured curriculum, so I’ll spin up a course.”
2. **On-screen:** Enter a course name, description, and thumbnail, then click `Create` to reach the course page.
   - **Voice-over:** “Course metadata lives in Convex, giving creators a fast editing loop.”
3. **On-screen:** Click `Edit course`, add a module titled “Introduction”, then add a lesson named “Welcome”, paste a YouTube URL, add a short lesson description, and save.
   - **Voice-over:** “Modules and lessons reuse the same data tree; pasting a YouTube link automatically renders a safe embed for learners.”

## Segment 8 – Join the Paid Community as a Member (05:35 – 06:05)

1. **On-screen:** In a second browser profile or incognito window, connect a different wallet using Passport, navigate to the community page, and click `Join`.
   - **Voice-over:** “From a member wallet, I open the community and hit Join.”
2. **On-screen:** Approve the spend if prompted, confirm the purchase, and show the unlocked tabs (`Feed`, `Classroom`, `Members`).
   - **Voice-over:** “After approving the MUSD transfer, the gated tabs unlock immediately.”

## Segment 9 – Marketplace Cooldown After Joining (06:05 – 06:20)

1. **On-screen:** With the member wallet still active, open `/marketplace` and click `List your membership`.
   - **Voice-over:** “Listing too early triggers the cooldown guard—CreatorBank enforces holding periods to stop instant flips.”
2. **On-screen:** Capture the cooldown message that displays remaining time before listing is allowed.
   - **Voice-over:** “The UI spells out exactly when selling becomes available.”

## Segment 10 – My Memberships & Cooldown Status (06:20 – 06:35)

1. **On-screen:** Navigate to `/memberships`, highlight the pass card with expiry timestamp and cooldown chip.
   - **Voice-over:** “Members can monitor expiry and cooldown status from one dashboard.”
2. **On-screen:** Click `List pass` and show the disabled state or tooltip that references the active cooldown.
   - **Voice-over:** “Until the timer clears, the list action stays disabled, keeping timelines aligned with course access.”

## Segment 11 – Feed: Admin Post (06:35 – 06:55)

1. **On-screen:** Switch back to the creator’s wallet, open the group page, and go to the `Feed` tab.
   - **Voice-over:** “Back as the creator, the feed makes announcements effortless.”
2. **On-screen:** Click `Write something`, compose a welcome post with links and expectations, then publish; show the post pinned at the top.
   - **Voice-over:** “I publish a welcome update with kickoff links, and it hits the top of the feed instantly.”

## Segment 12 – Feed: Member Engagement (06:55 – 07:10)

1. **On-screen:** Return to the member wallet, open the same feed, click the thumbs-up icon on the post, and add a comment.
   - **Voice-over:** “Members can react and comment in real time—likes and replies sync through Convex without refreshes.”
2. **On-screen:** Show the live incremented like count and new comment thread.
   - **Voice-over:** “The post updates immediately, reinforcing that engagement is two-way.”

## Segment 13 – Classroom: Member Learning (07:10 – 07:30)

1. **On-screen:** Staying on the member wallet, open the `Classroom` tab, enter the course created earlier, click the “Introduction” module, and select the “Welcome” lesson.
   - **Voice-over:** “Members dive straight into the curriculum; lessons stream with the YouTube embed and supporting notes we just authored.”
2. **On-screen:** Scroll through the lesson description and show the video playing.
   - **Voice-over:** “Everything stays within the community portal—no context switching required.”

## Segment 14 – Discover & Join a Free Community (07:30 – 07:50)

## Segment 15 – Marketplace: Primary, Listing, Floor Buy, Renew (07:50 – 08:30)

1. **On-screen:** Go to `/marketplace`; in the catalog, pick a course and click `Buy` on the primary price card; approve MUSD (if prompted) and confirm purchase.
   - **Voice-over:** “Primary mints settle in MUSD—approve once if needed, then confirm to mint the pass.”
2. **On-screen:** Pick an owned course that is transfer‑eligible and click `List`; choose a duration (e.g., 3 days), enter a price, and submit.
   - **Voice-over:** “Listings respect cooldowns and durations; set a price and duration, and your pass appears in live listings.”
3. **On-screen:** Scroll to `Live listings`, locate the lowest‑priced listing for a different course, and click `Buy floor`; confirm the purchase.
   - **Voice-over:** “Buying the floor uses the same MUSD allowance flow, then pulls the pass into your wallet.”
4. **On-screen:** For a pass nearing expiry in your catalog grid, click `Renew` and confirm the MUSD spend.
   - **Voice-over:** “Renewals extend access without minting a new token.”

## Segment 16 – Members: Invite by Wallet (08:30 – 08:45)

1. **On-screen:** Open `/[groupId]/members` as the owner; in the invite card, paste a wallet address and click `Add member`.
   - **Voice-over:** “Owners can invite members directly by wallet—CreatorBank adds them to the roster immediately.”

1. **On-screen:** Visit `/groups` to show the directory with filtering chips for free vs paid communities.
   - **Voice-over:** “CreatorBank also highlights discoverability with a directory of free and paid groups.”
2. **On-screen:** Click a free community card, press `Join for free`, and reveal the unlocked tabs (`Feed`, `Classroom`, `Members`).
   - **Voice-over:** “Free groups unlock instantly, so new members can explore content without friction.”
3. **On-screen:** Open the feed to scroll through historic posts, then hop into Classroom to open a different course and module.
   - **Voice-over:** “Even without payment, the experience mirrors paid cohorts—rich feeds, structured lessons, and transparent membership rosters.”

---

### Recording Tips

- Keep wallet pop-ups visible when approving MUSD transactions so the Mezo settlement flow is obvious.
- Run `pnpm convex:dev` and `pnpm dev` locally to keep status checks and pay pages responsive.
- Pre-fund test wallets with MUSD on Mezo Testnet via the Get MUSD shortcut to avoid delays mid-recording.
- If a transaction confirmation lags, cut to a prepared clip of the post-confirmation state to maintain pacing.

# CreatorBank Demo Video Script

This script outlines a 7–8 minute walkthrough of CreatorBank on the Mezo network. Each voice-over line is paired with the visual or interaction the audience should see at that moment.

---

## Segment 1 – Ecosystem Intro (00:00 – 00:10)

1. **On-screen:** Start on the CreatorBank landing hero (`/`), slowly pan across the headline, feature cards, and primary CTA.
   - **Voice-over 1:** “CreatorBank helps creators launch paid communities, teach members, and manage revenue on the Mezo network.”

## Segment 2 – Connect Wallet & Network Choice (00:10 – 00:40)

1. **On-screen:** Click `Connect wallet`, choose RainbowKit → MetaMask in the Passport modal, approve in the wallet, then show the navbar updating with the active chain and MUSD balance.
   - **Voice-over 2:** “Connect with Passport via RainbowKit and MetaMask—the header updates instantly to show the active chain and MUSD balance.”

## Segment 3 – Payments Dashboard Tour (00:40 – 02:15)

1. **On-screen:** Navigate to `/payments`; the overview banner renders at the top.
   - **Voice-over 3:** “The payments dashboard is the command center—status, links, invoices, payouts, and goals in one place.”
2. **On-screen:** Open the `SatsPay Links` tab, create a handle, and copy the generated pay URL.
   - **Voice-over 4:** “SatsPay Links turn any handle into a payable URL—perfect for donations or tips.”
   - Field inputs — type exactly:
     - Handle: `creatorbankdemo`
     - Title: `Creator Ops 101 — Tip Jar`
     - Description: `Support the Creator Ops 101 cohort with a quick tip.`
3. **On-screen:** Open the `Get MUSD` tab and reveal the Mezo testnet hub buttons for Swap and Borrow.
   - **Voice-over 5:** “When a wallet needs funds, the Get MUSD tab deep‑links to the Mezo hub’s swap and borrow flows.”
4. **On-screen:** Open the `Invoices` tab, add one line item, set an optional `Payer wallet`, attach a SatsPay handle, and click `Issue invoice`.
   - **Voice-over 6:** “Invoices are issued on‑chain via the Invoice Registry. CreatorBank hashes the invoice slug, records token and amount, and keeps the registry ID for later verification.”
   - Field inputs — type exactly:
     - Invoice title: `Pilot Package — Northstar Labs`
     - Paylink handle: `@creatorbankdemo`
     - Customer name: `Northstar Labs Ltd.`
     - Customer email: `ops@northstarlabs.test`
     - Payer wallet (optional): Leave blank
     - Due date: `2025-12-12`
     - Notes: `Scope: pilot deliverables and async support.`
     - Line items:
       - 1) Description: `Pilot deliverables (flat)` — Qty: `1` — Unit price (MUSD): `8.00`
5. **On-screen:** Open `Recurring Payouts`, add two collaborators with shares, and save.
   - **Voice-over 7:** “Payout schedules use the split router to push MUSD to each wallet in one transaction.”
   - Field inputs — type exactly:
     - Schedule name: `Creator Ops 101 — Revenue Split`
     - Recipient 1 — Wallet address: `0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` — Share (%): `70` — Label: `Creator`
     - Recipient 2 — Wallet address: `0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` — Share (%): `30` — Label: `Editor`
     - Execute Payout (after saving) — Amount (MUSD): `100.00`
6. **On-screen:** Open `Save Goals`, create an “Equipment Fund” with a target amount, and save.
   - **Voice-over 8:** “Save Goals track earmarked MUSD while funds stay in your wallet.”
   - Field inputs — type exactly:
     - Goal name: `Equipment Fund`
     - Target amount (MUSD): `850.00`
     - Target date (optional): `2025-12-31`
     - Notes (optional): `Camera upgrade + mic kit`
   - (Optional) Log contribution right after creating:
     - Add to goal — Amount (MUSD): `150.00` — Transaction hash (optional): `0x1111111111111111111111111111111111111111111111111111111111111111` — Memo: `Initial contribution`

## Segment 4 – Invoice Checkout (02:15 – 02:55)

1. **On-screen:** In `Payments → Invoices`, click `Copy payment link` on the newly issued invoice and show the URL.
2. **On-screen:** Switch to another browser profile (or incognito) with a different wallet connected. Paste the copied payment URL to open `/pay/creatorbankdemo?invoice=<invoice-slug>`; show the invoice card with number, amount due, and status “Awaiting payment”.
3. **On-screen:** Click `Approve MUSD`, wait for confirmation, then click `Pay invoice`; show the success toast and the status switching to “Paid”. Return to `Payments → Invoices` in the original browser to confirm the row now shows `Paid` with the tx hash.
   - **Voice-over 9:** “In the invoices tab, Copy the payment link, then open it in a separate browser to pay. First approve the registry, then settle the invoice. CreatorBank records the settlement and updates the ledger the moment Mezo confirms.”

## Segment 5 – Create a Paid Community (03:20 – 04:10)

1. **On-screen:** Navigate to `/create` with the connected wallet; show the pricing card quoting the monthly platform fee in MUSD. Fill in sample details (name, tagline, description, pricing, media), then submit the form.
   - Field inputs — type exactly:
     - Group name: `Telusko Group`
     - Tagline: `Learn Java, Spring/Spring Boot/Spring AI, DevOps (with AWS), REST API/Web Services, Hibernate/ORM frameworks, and microservices live and self-paced from telusko`
     - Membership pricing: `Paid (Monthly)`
     - Monthly price (USD): `5.00`
     - Thumbnail (link tab): Get on YouTube
     - Intro Video URL (optional): `https://www.youtube.com/watch?v=7xIpeyBc-jY`
     - Tags (optional): `tech`
     - (Optional) Gallery image (link): Get on YouTube
  
   - **Voice-over 10:** “Let's now go to create community page, then enter the group details and monthly pricing, and etc then click Create Community and approve the transactions.”

## Segment 6 – About, Verify, Edit Details (04:10 – 04:55)

1. **On-screen:** Land on the group About tab that displays the course ID and membership summary.
   - **Voice-over 11:** “The About page surfaces the onchain course ID with a Mezo explorer link for verification. Inside Edit group details I can check the renewable 30‑day subscription, tweak the description, tagline, pricing, thumbnail, intro video URL, tags, every About section field, and add administrators with share percentages. Saving applies everything instantly.”

## Segment 7 – Classroom: Create Course, Modules, Lessons (04:55 – 05:35)

1. **On-screen:** Switch to the Classroom tab and click `Create a course`.
   - **Voice-over 12:** “I create a course that will hold modules and lessons. In this tutorial I will copy sample content from a public YouTube playlist and paste the titles and details here so you can see the flow. In production, creators use this same flow to publish their own lessons and sell access as part of their community.”

## Segment 8 – Join the Paid Community as a Member (05:35 – 06:05)

1. **On-screen:** In a second browser profile or incognito window, connect a different wallet using Passport, navigate to the community page, and click `Join`.
   - **Voice-over 13:** “I switch to a second wallet in another browser. I open the paid group and click Join. If prompted I approve the spend and confirm the purchase.”

## Segment 9 – Marketplace Cooldown After Joining (06:05 – 06:20)

1. **On-screen:** With the member wallet still active, open `/marketplace` and click `List your membership`.
   - **Voice-over 14:** “I open the Marketplace page and click List Your Membership. Because I just joined there is a transfer cooldown. This prevents quick flip abuse and keeps value aligned with course timelines.”

## Segment 10 – My Memberships & Cooldown Status (06:20 – 06:35)

1. **On-screen:** Navigate to `/memberships`, highlight the pass card with expiry timestamp and cooldown chip.
   - **Voice-over 15:** “In My Memberships I can see expiry and cooldown clearly. Listing stays blocked until the cooldown ends.”

## Segment 11 – Feed: Admin Post (06:35 – 06:55)

1. **On-screen:** Switch back to the creator’s wallet, open the group page, and go to the `Feed` tab.
   - **Voice-over 16:** “I switch back to the owner account, open my group, and go to the Feed tab. I click Write something, add a short welcome update with key links and expectations for the cohort, then publish it.”

## Segment 12 – Feed: Member Engagement (06:55 – 07:10)

1. **On-screen:** Return to the member wallet, open the same feed, click the thumbs-up icon on the post, and add a comment.
   - **Voice-over 17:** “As a member I like the post and add a comment. The feed updates in real time.”

## Segment 13 – Classroom: Member Learning (07:10 – 07:30)

1. **On-screen:** Staying on the member wallet, open the `Classroom` tab, enter the course created earlier, click the “Introduction” module, and select the “Welcome” lesson.
   - **Voice-over 18:** “This course uses sample content from a YouTube playlist so you can see the flow. In production, creators publish their own lessons and grow a paid community around them.”

## Segment 14 – Discover & Join a Free Community (07:30 – 07:50)

1. **On-screen:** Open Discover/Groups at /groups. Show a mix of free and paid groups. Click a free group card. On the group page, click Join for free. Tabs for Feed, Classroom, and Members appear. Open Feed to see a history of admin and user interactions. Open Classroom to view courses; click a course to see its modules and lessons. Navigate to another course and repeat.
   - **Voice-over 19:** “On the Discover page you can see both free and paid groups. We already joined a paid group, so now I’ll join a free group. I click the free group and hit Join for free. Access unlocks immediately, so Feed, Classroom, and Members appear. I can scroll the feed to see past admin posts and member activity. In the classroom I can open a course, browse its modules, and view lessons. I can also jump into other courses and do the same.

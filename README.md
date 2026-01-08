# 💳 Subscription Tracker

Find and cancel hidden subscriptions costing you thousands per year.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
cd sub-tracker
npm install
```

2. **Run the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:3000`

## 🧪 Testing the App

### Using the Sample CSV

1. Start the dev server (`npm run dev`)
2. Open `http://localhost:3000` in your browser
3. Click "Click to upload CSV files"
4. Upload the `sample-transactions.csv` file (located in the project root)
5. Click "Analyze My Subscriptions"

You should see:
- **Total Annual Cost:** ~$739.44
- **4 subscriptions detected:**
  - Netflix: $15.49/month = $185.88/year
  - Spotify: $10.99/month = $131.88/year
  - Amazon Prime: $14.99/month = $179.88/year
  - Apple: $4.99/month = $59.88/year

### Testing with Your Own Data

**CSV Format Requirements:**

Your CSV must have these columns (names can vary):
- **Date** (any date format)
- **Description/Merchant** (transaction name)
- **Amount** (dollar amount)

Example:
```csv
Date,Description,Amount
2024-10-15,NETFLIX.COM,15.49
2024-10-10,SPOTIFY USA,10.99
```

**Export from your bank:**
1. Log into your bank's website
2. Go to Transactions/Statements
3. Export as CSV (usually 3-6 months recommended)
4. Upload to the app

## 🎯 Features

### Currently Working:
✅ CSV upload (multiple files)
✅ Subscription detection algorithm
✅ Annual cost calculation
✅ Cancel links for 20+ popular services
✅ Confidence scoring
✅ Payment gate simulation

### Detection Algorithm:

The app identifies subscriptions by:
- **Pattern matching:** Looks for repeated charges from same merchant
- **Frequency detection:** Identifies monthly, quarterly, or annual billing
- **Amount consistency:** Confirms charges are similar amounts
- **Known services:** Recognizes 30+ popular subscription services
- **Confidence scoring:** Shows reliability of each detection

### Supported Services with Cancel Links:

- Netflix, Spotify, Hulu, Disney+
- Amazon Prime, Apple subscriptions
- Adobe, Microsoft, Dropbox
- Gyms, VPNs (NordVPN, ExpressVPN)
- LinkedIn, Canva, Grammarly
- YouTube Premium, Audible
- And more...

## 💰 Monetization (Next Steps)

### Stripe Integration

To add real payments:

1. **Get Stripe API keys:**
   - Sign up at stripe.com
   - Get test/live API keys

2. **Install Stripe:**
```bash
npm install stripe @stripe/stripe-js
```

3. **Add environment variables:**
Create `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

4. **Replace the payment button:**
Currently using simulated payment - replace with Stripe Checkout

## 📁 Project Structure

```
sub-tracker/
├── pages/
│   ├── index.tsx          # Main app page
│   └── _app.tsx           # Next.js app wrapper
├── utils/
│   ├── subscriptionDetector.ts  # Core detection logic
│   └── cancelLinks.ts           # Cancel URL database
├── sample-transactions.csv      # Test data
└── package.json
```

## 🔧 Customization

### Add More Cancel Links

Edit `utils/cancelLinks.ts`:

```typescript
{
  merchant: 'yourservice',
  url: 'https://example.com/cancel',
  instructions: 'Steps to cancel...'
}
```

### Improve Detection

Edit `utils/subscriptionDetector.ts`:
- Add merchant keywords to `KNOWN_SUBSCRIPTIONS`
- Adjust frequency thresholds (currently 25-35 days for monthly)
- Modify confidence scoring

## 🚀 Deployment

### Deploy to Vercel (Free):

1. Push code to GitHub
2. Import to Vercel (vercel.com)
3. Deploy (automatic)

### Add Custom Domain:

In Vercel dashboard:
- Settings → Domains → Add your domain
- Update DNS records as instructed

## 📊 Business Metrics to Track

When live:
- Conversion rate (uploads → paid reports)
- Average subscriptions detected per user
- Most common subscriptions found
- Cancellation success rate
- User feedback on detection accuracy

## 🔐 Security Considerations

**Current setup (development):**
- Files processed in browser (client-side)
- No data sent to server
- No storage of user data

**For production:**
- Consider adding file encryption
- Implement rate limiting
- Add CAPTCHA to prevent abuse
- Store aggregate data only (never raw transactions)

## 💡 Growth Ideas

1. **Upsells:**
   - Monthly monitoring ($9.99/mo)
   - Cancel-for-you service ($29.99)
   - Business subscription audit

2. **Partnerships:**
   - Affiliate links for better alternatives
   - Credit card recommendations

3. **Content Marketing:**
   - "Average person has $X in subscriptions"
   - Platform-specific guides
   - Comparison charts

## 🐛 Troubleshooting

**CSV not parsing:**
- Check column names contain: date, description/merchant, amount
- Ensure amounts are numbers (remove $ symbols in CSV)
- Verify dates are in recognizable format

**No subscriptions detected:**
- Need at least 2 charges from same merchant
- Upload more months of data (3+ recommended)
- Check merchant names are consistent

**Port 3000 already in use:**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

## 📝 License

MIT - Build whatever you want with this!

---

**Ready to launch?** This is your MVP. Test it, gather feedback, then add Stripe and start running ads! 🚀

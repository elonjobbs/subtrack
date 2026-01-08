export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

function extractAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$,]/g, '').trim();
  return Math.abs(parseFloat(cleaned)) || 0;
}

export function parseCSVUniversal(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  const rows = lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += char;
    }
    result.push(current.trim());
    return result;
  });
  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  
  let dateCol = -1, amountCol = -1, merchantCol = -1;
  headerRow.forEach((header, idx) => {
    const h = header.toLowerCase();
    if (dateCol === -1 && (h.includes('date') || h.includes('posted'))) dateCol = idx;
    if (h.includes('description') || h.includes('merchant') || h.includes('payee') || h.includes('memo')) merchantCol = idx;
    if (amountCol === -1 && (h.includes('amount') || h.includes('debit'))) amountCol = idx;
  });
  
  const transactions: Transaction[] = [];
  for (const row of dataRows) {
    const date = dateCol >= 0 ? row[dateCol] : '';
    const amount = amountCol >= 0 ? extractAmount(row[amountCol]) : 0;
    let merchant = merchantCol >= 0 ? row[merchantCol] : '';
    if (merchant && amount > 0) transactions.push({ date, merchant: merchant.replace(/['"]/g, '').trim(), amount });
  }
  return transactions;
}

export function parsePDFText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Pattern to match Navy Federal format:
  // "POS Debit- Debit Card 2582 11-25-25 DD *doordashdashpa Doordash.Com CA 11-28"
  // followed later by amounts like "9.99" 
  
  // First, let's extract merchant names with their amounts
  // Pattern: date + POS Debit + description + amount
  const pattern = /(\d{1,2}-\d{1,2}(?:-\d{2,4})?)\s+(?:POS\s+)?(?:Debit-?\s*)?(?:Debit Card \d+\s+)?(?:\d{1,2}-\d{1,2}-\d{2,4}\s+)?([A-Za-z\*][A-Za-z0-9\s\*\.\#\-\']+?)(?:\s+[A-Z]{2}\s+)?(?:\d{1,2}-\d{1,2}\s+)?.*?(\d{1,3}(?:,\d{3})*\.\d{2})/g;

  // Also try to find known subscription services directly
  const knownServices = [
    { pattern: /doordash|dd \*/gi, name: 'DoorDash' },
    { pattern: /netflix/gi, name: 'Netflix' },
    { pattern: /spotify/gi, name: 'Spotify' },
    { pattern: /apple\s*(cash|music|tv|one)?/gi, name: 'Apple' },
    { pattern: /amazon|amzn/gi, name: 'Amazon' },
    { pattern: /playstation|psn/gi, name: 'PlayStation' },
    { pattern: /xbox/gi, name: 'Xbox' },
    { pattern: /hulu/gi, name: 'Hulu' },
    { pattern: /disney\+?/gi, name: 'Disney+' },
    { pattern: /hbo|max/gi, name: 'HBO Max' },
    { pattern: /youtube/gi, name: 'YouTube' },
    { pattern: /uber(?!\s*eats)/gi, name: 'Uber' },
    { pattern: /uber\s*eats/gi, name: 'Uber Eats' },
    { pattern: /lyft/gi, name: 'Lyft' },
    { pattern: /grubhub/gi, name: 'Grubhub' },
    { pattern: /instacart/gi, name: 'Instacart' },
    { pattern: /tradingview/gi, name: 'TradingView' },
    { pattern: /tropical smoothie/gi, name: 'Tropical Smoothie' },
    { pattern: /domino/gi, name: 'Dominos' },
    { pattern: /tiktok/gi, name: 'TikTok' },
    { pattern: /facebk|facebook/gi, name: 'Facebook Ads' },
    { pattern: /prime video/gi, name: 'Prime Video' },
    { pattern: /audible/gi, name: 'Audible' },
    { pattern: /kindle/gi, name: 'Kindle' },
    { pattern: /chatgpt|openai/gi, name: 'ChatGPT' },
    { pattern: /github/gi, name: 'GitHub' },
    { pattern: /dropbox/gi, name: 'Dropbox' },
    { pattern: /icloud/gi, name: 'iCloud' },
    { pattern: /google\s*(one|storage|play)?/gi, name: 'Google' },
    { pattern: /microsoft|msft/gi, name: 'Microsoft' },
    { pattern: /adobe/gi, name: 'Adobe' },
    { pattern: /canva/gi, name: 'Canva' },
    { pattern: /notion/gi, name: 'Notion' },
    { pattern: /slack/gi, name: 'Slack' },
    { pattern: /zoom/gi, name: 'Zoom' },
    { pattern: /nordvpn/gi, name: 'NordVPN' },
    { pattern: /expressvpn/gi, name: 'ExpressVPN' },
    { pattern: /sirius/gi, name: 'SiriusXM' },
    { pattern: /pandora/gi, name: 'Pandora' },
    { pattern: /tidal/gi, name: 'Tidal' },
    { pattern: /crunchyroll/gi, name: 'Crunchyroll' },
    { pattern: /headspace/gi, name: 'Headspace' },
    { pattern: /calm/gi, name: 'Calm' },
    { pattern: /peloton/gi, name: 'Peloton' },
    { pattern: /strava/gi, name: 'Strava' },
    { pattern: /duolingo/gi, name: 'Duolingo' },
    { pattern: /grammarly/gi, name: 'Grammarly' },
    { pattern: /medium/gi, name: 'Medium' },
    { pattern: /patreon/gi, name: 'Patreon' },
    { pattern: /twitch/gi, name: 'Twitch' },
    { pattern: /wawa/gi, name: 'Wawa' },
    { pattern: /target/gi, name: 'Target' },
    { pattern: /walmart/gi, name: 'Walmart' },
    { pattern: /costco/gi, name: 'Costco' },
    { pattern: /cash\s*app/gi, name: 'Cash App' },
    { pattern: /zelle/gi, name: 'Zelle' },
    { pattern: /venmo/gi, name: 'Venmo' },
    { pattern: /shopify/gi, name: 'Shopify' },
    { pattern: /foot\s*locker/gi, name: 'Foot Locker' },
    { pattern: /7-eleven|7eleven/gi, name: '7-Eleven' },
    { pattern: /cvs/gi, name: 'CVS' },
    { pattern: /walgreens/gi, name: 'Walgreens' },
  ];

  // Find amounts in the text (pattern: number with 2 decimal places)
  const amounts = text.match(/\d{1,3}(?:,\d{3})*\.\d{2}/g) || [];
  
  // For each known service, find all occurrences and pair with nearby amounts
  for (const service of knownServices) {
    const matches = text.match(service.pattern);
    if (matches) {
      // Find amounts near this service mention
      const serviceIndex = text.search(service.pattern);
      
      // Look for amounts that appear after common subscription prices
      const relevantAmounts = amounts.filter(a => {
        const amt = extractAmount(a);
        return amt >= 0.99 && amt <= 200; // Typical subscription range
      });
      
      // Count occurrences
      const count = matches.length;
      
      // Try to find the most common amount for this service
      const amountCounts = new Map<number, number>();
      for (const a of relevantAmounts) {
        const amt = Math.round(extractAmount(a) * 100) / 100;
        amountCounts.set(amt, (amountCounts.get(amt) || 0) + 1);
      }
      
      // Get typical subscription amounts for this service
      let amount = 0;
      
      // Look for this pattern: "ServiceName ... XX.XX-" (Navy Federal shows debits with minus)
      const amountPattern = new RegExp(service.pattern.source + '[^0-9]*?(\\d{1,3}\\.\\d{2})', 'gi');
      const amountMatch = amountPattern.exec(text);
      if (amountMatch) {
        amount = extractAmount(amountMatch[1]);
      }
      
      if (amount > 0 && amount < 500) {
        transactions.push({
          date: '',
          merchant: service.name,
          amount: amount
        });
      }
    }
  }

  // Also parse the direct transaction lines
  // Pattern: "11-28 POS Debit- Debit Card 2582 11-28-25 Playstation Networ 800-345-7669 CA"
  // Followed by amount on same line or pattern
  
  const linePattern = /(\d{1,2}-\d{1,2})\s+POS\s+Debit-?\s+(?:Debit Card \d+\s+)?(\d{1,2}-\d{1,2}-\d{2,4}\s+)?([A-Za-z][A-Za-z0-9\s\*\.\-]+?)(?:\s+\d{3}-\d{3}-\d{4})?(?:\s+[A-Z]{2})?\s+(\d{1,2}-\d{1,2})/g;
  
  let match;
  while ((match = linePattern.exec(text)) !== null) {
    let merchant = match[3].trim();
    // Clean up merchant name
    merchant = merchant.replace(/\s+/g, ' ').trim();
    if (merchant.length > 2 && merchant.length < 50) {
      // We'll need to find the amount separately
      transactions.push({
        date: match[1],
        merchant: merchant,
        amount: 0 // Will be filled in later
      });
    }
  }

  // Now let's try a simpler approach - just find all amounts and associate with nearby text
  const simplePattern = /([A-Za-z\*][A-Za-z0-9\s\*\.\-\']{2,30})\s+(\d{1,3}\.\d{2})-?\s+\d/g;
  while ((match = simplePattern.exec(text)) !== null) {
    const merchant = match[1].trim();
    const amount = extractAmount(match[2]);
    
    // Skip junk
    const skipWords = ['balance', 'total', 'page', 'statement', 'account', 'period', 'routing', 'member', 'credit union', 'previous', 'ending', 'beginning', 'withdrawal', 'deposit', 'dividend'];
    const lowerMerchant = merchant.toLowerCase();
    if (skipWords.some(w => lowerMerchant.includes(w))) continue;
    if (amount <= 0 || amount > 5000) continue;
    
    transactions.push({
      date: '',
      merchant: merchant,
      amount: amount
    });
  }

  console.log('Parsed transactions:', transactions.length);
  return transactions;
}

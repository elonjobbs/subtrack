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
  
  // Clean up the text - PDF extraction often has weird spacing
  const cleanText = text.replace(/\s+/g, ' ');
  
  // Look for patterns with dates and amounts
  // Navy Federal format: "11-26 POS Debit- Debit Card 2582 11-25-25 DD *doordashdashpa Doordash.Com CA 9.99- 5,415.23"
  
  // Pattern 1: Match "MM-DD description amount- balance" (Navy Federal style)
  const navyPattern = /(\d{1,2}-\d{1,2})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})-?\s+\d{1,3}(?:,\d{3})*\.\d{2}/g;
  
  let match;
  while ((match = navyPattern.exec(cleanText)) !== null) {
    const date = match[1];
    let description = match[2];
    const amount = extractAmount(match[3]);
    
    // Skip non-transaction lines
    const skipWords = ['beginning balance', 'ending balance', 'previous', 'total', 'statement', 'page', 'account', 'routing', 'credit union', 'member'];
    const lowerDesc = description.toLowerCase();
    if (skipWords.some(w => lowerDesc.includes(w))) continue;
    
    // Clean up the description to get merchant name
    // Remove "POS Debit- Debit Card XXXX MM-DD-YY" prefix
    description = description.replace(/POS\s*(Debit|Credit)?\s*-?\s*(Debit Card)?\s*\d*\s*\d{1,2}-\d{1,2}-\d{2,4}?\s*/gi, '');
    description = description.replace(/Transaction\s*\d{1,2}-\d{1,2}-\d{2,4}?\s*/gi, '');
    description = description.replace(/\d{3}-\d{3}-\d{4}/g, ''); // Remove phone numbers
    description = description.replace(/\s+[A-Z]{2}$/i, ''); // Remove state codes
    description = description.trim();
    
    if (amount > 0 && amount < 10000 && description.length > 2) {
      transactions.push({ date, merchant: description, amount });
    }
  }
  
  // Pattern 2: Look for known subscription names with amounts
  const knownSubs = ['netflix', 'spotify', 'apple', 'amazon', 'hulu', 'disney', 'youtube', 'hbo', 'doordash', 
    'uber', 'lyft', 'playstation', 'xbox', 'nintendo', 'adobe', 'microsoft', 'google', 'prime', 
    'grubhub', 'instacart', 'walmart', 'costco', 'gym', 'fitness', 'planet fitness',
    'tradingview', 'chatgpt', 'openai', 'github', 'dropbox', 'icloud', 'tiktok', 'facebook', 'facebk'];
  
  for (const sub of knownSubs) {
    const subPattern = new RegExp(`(${sub}[\\w\\s*#]*?)\\s+(\\d{1,3}(?:,\\d{3})*\\.\\d{2})`, 'gi');
    let subMatch;
    while ((subMatch = subPattern.exec(cleanText)) !== null) {
      const merchant = subMatch[1].trim();
      const amount = extractAmount(subMatch[2]);
      if (amount > 0 && amount < 500 && merchant.length > 2) {
        // Check if we already have this transaction
        const exists = transactions.some(t => 
          t.merchant.toLowerCase().includes(sub) && Math.abs(t.amount - amount) < 0.01
        );
        if (!exists) {
          transactions.push({ date: '', merchant, amount });
        }
      }
    }
  }
  
  // Pattern 3: Simple "date amount" pairs for Items Paid section
  const itemsPattern = /(\d{1,2}-\d{1,2})\s+POS\s+(\d{1,3}(?:,\d{3})*\.\d{2})/g;
  while ((match = itemsPattern.exec(cleanText)) !== null) {
    const date = match[1];
    const amount = extractAmount(match[2]);
    if (amount > 0 && amount < 1000) {
      transactions.push({ date, merchant: 'POS Purchase', amount });
    }
  }
  
  console.log('Found transactions:', transactions.length);
  return transactions;
}

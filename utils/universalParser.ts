export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

function extractAmount(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$,\s-]/g, '').trim();
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
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  // Navy Federal format: "11-26 POS Debit- ... merchant ... 9.99- 5,415.23"
  // The amount is followed by a minus sign for debits
  // Pattern: Date at start, amount with optional minus, balance at end
  
  const navyFedPattern = /^(\d{1,2}-\d{1,2})\s+(.+?)\s+([\d,]+\.\d{2})-?\s+([\d,]+\.\d{2})$/;
  const genericPattern = /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)\s+(.+?)\s+\$?([\d,]+\.\d{2})/;
  
  for (const line of lines) {
    // Skip header lines and non-transaction lines
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('beginning balance') || 
        lowerLine.includes('ending balance') ||
        lowerLine.includes('statement') ||
        lowerLine.includes('page') ||
        lowerLine.includes('account') ||
        lowerLine.includes('total') ||
        lowerLine.includes('credit union') ||
        lowerLine.includes('routing') ||
        lowerLine.includes('access no')) {
      continue;
    }
    
    // Try Navy Federal pattern first
    let match = line.match(navyFedPattern);
    if (match) {
      const [, date, description, amountStr] = match;
      const amount = extractAmount(amountStr);
      
      // Extract merchant name from description
      let merchant = description;
      // Clean up "POS Debit- Debit Card 2582 11-25-25" prefix
      merchant = merchant.replace(/^POS\s*(Debit|Credit)?\s*-?\s*Debit Card\s*\d+\s*\d{1,2}-\d{1,2}-\d{2,4}\s*/i, '');
      merchant = merchant.replace(/^POS\s*(Debit|Credit)?\s*-?\s*.*?Transaction\s*\d{1,2}-\d{1,2}-\d{2,4}\s*/i, '');
      merchant = merchant.replace(/Debit Card \d+/i, '');
      merchant = merchant.replace(/\d{3}-\d{3}-\d{4}/g, ''); // Remove phone numbers
      merchant = merchant.replace(/\s+[A-Z]{2}$/, ''); // Remove state codes at end
      merchant = merchant.trim();
      
      if (amount > 0 && amount < 5000 && merchant.length > 2) {
        transactions.push({ date, merchant, amount });
      }
      continue;
    }
    
    // Try generic pattern
    match = line.match(genericPattern);
    if (match) {
      const [, date, description, amountStr] = match;
      const amount = extractAmount(amountStr);
      let merchant = description.trim();
      
      if (amount > 0 && amount < 5000 && merchant.length > 2) {
        transactions.push({ date, merchant, amount });
      }
    }
  }
  
  // Also look for simpler format like "12-11 POS 18.49"
  const simplePattern = /^(\d{1,2}-\d{1,2})\s+POS\s+([\d,]+\.\d{2})$/;
  for (const line of lines) {
    const match = line.match(simplePattern);
    if (match) {
      const [, date, amountStr] = match;
      const amount = extractAmount(amountStr);
      if (amount > 0 && amount < 5000) {
        transactions.push({ date, merchant: 'POS Transaction', amount });
      }
    }
  }
  
  return transactions;
}

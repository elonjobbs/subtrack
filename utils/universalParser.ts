export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

const DATE_PATTERNS = [
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,
];

function isDate(str: string): boolean {
  if (!str) return false;
  return DATE_PATTERNS.some(pattern => pattern.test(str.trim()));
}

function isMoney(str: string): boolean {
  if (!str) return false;
  const cleaned = str.replace(/[$,\s]/g, '').trim();
  return !isNaN(parseFloat(cleaned)) && /^-?\d+\.?\d*$/.test(cleaned);
}

function extractAmount(str: string): number {
  if (!str) return 0;
  return Math.abs(parseFloat(str.replace(/[$,\s]/g, ''))) || 0;
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

  if (dateCol === -1 || amountCol === -1 || merchantCol === -1) {
    for (let col = 0; col < headerRow.length; col++) {
      let dates = 0, money = 0, textLen = 0;
      dataRows.slice(0, 10).forEach(row => {
        const val = row[col] || '';
        if (isDate(val)) dates++;
        if (isMoney(val)) money++;
        textLen += val.length;
      });
      if (dateCol === -1 && dates >= 5) dateCol = col;
      if (amountCol === -1 && money >= 5) amountCol = col;
      if (merchantCol === -1 && dates < 2 && money < 2 && textLen > 50) merchantCol = col;
    }
  }

  const transactions: Transaction[] = [];
  for (const row of dataRows) {
    const date = dateCol >= 0 ? row[dateCol] : '';
    const amount = amountCol >= 0 ? extractAmount(row[amountCol]) : 0;
    let merchant = merchantCol >= 0 ? row[merchantCol] : '';
    if (!merchant) {
      let maxLen = 0;
      row.forEach(val => { if (!isDate(val) && !isMoney(val) && val.length > maxLen) { maxLen = val.length; merchant = val; }});
    }
    if (merchant && amount > 0) transactions.push({ date, merchant: merchant.replace(/['"]/g, '').trim(), amount });
  }
  return transactions;
}

export function parsePDFText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const match = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4})\s+(.+?)\s+(-?\$?[\d,]+\.?\d{0,2})\s*$/);
    if (match) {
      const amount = extractAmount(match[3]);
      if (amount > 0) transactions.push({ date: match[1], merchant: match[2].trim(), amount });
    }
  }
  return transactions;
}

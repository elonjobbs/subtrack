import { parseISO, format } from 'date-fns';
import differenceInDays from 'date-fns/differenceInDays';

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  description?: string;
}

export interface Subscription {
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'annual' | 'quarterly';
  annualCost: number;
  transactions: Transaction[];
  confidence: number;
}

// Common subscription merchants
const KNOWN_SUBSCRIPTIONS = [
  'netflix', 'spotify', 'apple', 'amazon prime', 'hulu', 'disney',
  'youtube', 'gym', 'fitness', 'adobe', 'microsoft', 'dropbox',
  'google', 'icloud', 'audible', 'kindle', 'hbo', 'paramount',
  'peacock', 'crunchyroll', 'duolingo', 'notion', 'slack',
  'zoom', 'linkedin', 'canva', 'grammarly', 'nordvpn', 'expressvpn'
];

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  // Find column indices
  const dateIndex = headers.findIndex(h => 
    h.includes('date') || h.includes('trans') || h.includes('post')
  );
  const merchantIndex = headers.findIndex(h => 
    h.includes('merchant') || h.includes('description') || h.includes('name')
  );
  const amountIndex = headers.findIndex(h => 
    h.includes('amount') || h.includes('debit') || h.includes('charge')
  );

  if (dateIndex === -1 || merchantIndex === -1 || amountIndex === -1) {
    throw new Error('Could not find required columns (date, merchant, amount)');
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(c => c.trim());
    
    if (columns.length < 3) continue;

    const amount = parseFloat(columns[amountIndex].replace(/[^0-9.-]/g, ''));
    
    // Skip credits/refunds
    if (amount <= 0) continue;

    transactions.push({
      date: columns[dateIndex],
      merchant: columns[merchantIndex].replace(/['"]/g, ''),
      amount: Math.abs(amount),
      description: columns[merchantIndex]
    });
  }

  return transactions;
}

function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelySubscription(merchant: string): boolean {
  const normalized = normalizeMerchant(merchant);
  return KNOWN_SUBSCRIPTIONS.some(sub => normalized.includes(sub));
}

function groupTransactionsByMerchant(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const key = normalizeMerchant(transaction.merchant);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(transaction);
  }

  return groups;
}

function detectFrequency(transactions: Transaction[]): {
  frequency: 'monthly' | 'annual' | 'quarterly';
  confidence: number;
} {
  if (transactions.length < 2) {
    return { frequency: 'monthly', confidence: 0.3 };
  }

  // Sort by date
  const sorted = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = differenceInDays(
      parseISO(sorted[i].date),
      parseISO(sorted[i - 1].date)
    );
    gaps.push(days);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  // Monthly: 28-35 days
  if (avgGap >= 25 && avgGap <= 35) {
    return { frequency: 'monthly', confidence: 0.9 };
  }
  
  // Quarterly: 85-95 days
  if (avgGap >= 80 && avgGap <= 100) {
    return { frequency: 'quarterly', confidence: 0.85 };
  }
  
  // Annual: 350-380 days
  if (avgGap >= 340 && avgGap <= 380) {
    return { frequency: 'annual', confidence: 0.85 };
  }

  // Default to monthly with low confidence
  return { frequency: 'monthly', confidence: 0.4 };
}

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const groups = groupTransactionsByMerchant(transactions);
  const subscriptions: Subscription[] = [];

  for (const [merchantKey, txns] of groups.entries()) {
    // Need at least 2 transactions to detect pattern
    if (txns.length < 2) {
      // Check if it's a known subscription service
      if (isLikelySubscription(merchantKey)) {
        const { frequency, confidence } = detectFrequency(txns);
        const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
        
        subscriptions.push({
          merchant: txns[0].merchant,
          amount: avgAmount,
          frequency,
          annualCost: frequency === 'monthly' ? avgAmount * 12 :
                     frequency === 'quarterly' ? avgAmount * 4 :
                     avgAmount,
          transactions: txns,
          confidence: confidence * 0.7 // Lower confidence for single transaction
        });
      }
      continue;
    }

    const { frequency, confidence } = detectFrequency(txns);
    
    // Only include if confidence is reasonable
    if (confidence < 0.4) continue;

    // Check amount consistency
    const amounts = txns.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxDeviation = Math.max(...amounts.map(a => Math.abs(a - avgAmount)));
    
    // If amounts vary too much, it's probably not a subscription
    if (maxDeviation > avgAmount * 0.15) {
      continue;
    }

    // Boost confidence if it's a known subscription service
    let finalConfidence = confidence;
    if (isLikelySubscription(merchantKey)) {
      finalConfidence = Math.min(0.95, confidence + 0.2);
    }

    subscriptions.push({
      merchant: txns[0].merchant,
      amount: avgAmount,
      frequency,
      annualCost: frequency === 'monthly' ? avgAmount * 12 :
                 frequency === 'quarterly' ? avgAmount * 4 :
                 avgAmount,
      transactions: txns,
      confidence: finalConfidence
    });
  }

  // Sort by annual cost (highest first)
  return subscriptions.sort((a, b) => b.annualCost - a.annualCost);
}

export function calculateTotalAnnualCost(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => sum + sub.annualCost, 0);
}

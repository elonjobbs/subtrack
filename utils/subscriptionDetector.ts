import { Transaction, parseCSVUniversal, parsePDFText } from './universalParser';

export interface Subscription {
  merchant: string;
  amount: number;
  frequency: 'monthly' | 'annual' | 'quarterly';
  annualCost: number;
  transactions: Transaction[];
  confidence: number;
}

export type { Transaction };
export { parseCSVUniversal, parsePDFText };

const KNOWN_SUBSCRIPTIONS = [
  'netflix', 'spotify', 'apple', 'amazon', 'hulu', 'disney', 'youtube', 'gym',
  'fitness', 'adobe', 'microsoft', 'dropbox', 'google', 'icloud', 'audible',
  'hbo', 'max', 'paramount', 'peacock', 'crunchyroll', 'duolingo', 'notion',
  'slack', 'zoom', 'linkedin', 'canva', 'grammarly', 'nordvpn', 'expressvpn',
  'chatgpt', 'openai', 'github', 'shopify', 'mailchimp', 'nytimes', 'wsj',
  'medium', 'patreon', 'twitch', 'xbox', 'playstation', 'nintendo', 'steam',
  'peloton', 'headspace', 'calm', 'hello fresh', 'doordash', 'uber', 'costco',
  'sirius', 'pandora', 'tidal', 'bumble', 'tinder', 'hinge', 'norton', 'mcafee'
];

function normalizeMerchant(merchant: string): string {
  return merchant.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function isLikelySubscription(merchant: string): boolean {
  const normalized = normalizeMerchant(merchant);
  return KNOWN_SUBSCRIPTIONS.some(sub => normalized.includes(sub));
}

function detectFrequency(transactions: Transaction[]): { frequency: 'monthly' | 'annual' | 'quarterly'; confidence: number } {
  if (transactions.length < 2) return { frequency: 'monthly', confidence: 0.3 };
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const days = Math.floor((new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / 86400000);
    if (days > 0) gaps.push(days);
  }
  if (gaps.length === 0) return { frequency: 'monthly', confidence: 0.3 };
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avgGap >= 25 && avgGap <= 35) return { frequency: 'monthly', confidence: 0.9 };
  if (avgGap >= 80 && avgGap <= 100) return { frequency: 'quarterly', confidence: 0.85 };
  if (avgGap >= 340 && avgGap <= 380) return { frequency: 'annual', confidence: 0.85 };
  return { frequency: 'monthly', confidence: 0.4 };
}

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const key = normalizeMerchant(t.merchant);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const subscriptions: Subscription[] = [];
  for (const [key, txns] of groups.entries()) {
    const amounts = txns.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (avgAmount < 1 || avgAmount > 500) continue;
    if (txns.length < 2 && !isLikelySubscription(key)) continue;
    const { frequency, confidence } = detectFrequency(txns);
    const maxDev = Math.max(...amounts.map(a => Math.abs(a - avgAmount)));
    if (maxDev > avgAmount * 0.2) continue;
    let finalConf = isLikelySubscription(key) ? Math.min(0.95, confidence + 0.2) : confidence;
    if (finalConf < 0.3) continue;
    subscriptions.push({
      merchant: txns[0].merchant,
      amount: avgAmount,
      frequency,
      annualCost: frequency === 'monthly' ? avgAmount * 12 : frequency === 'quarterly' ? avgAmount * 4 : avgAmount,
      transactions: txns,
      confidence: finalConf
    });
  }
  return subscriptions.sort((a, b) => b.annualCost - a.annualCost);
}

export function calculateTotalAnnualCost(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => sum + sub.annualCost, 0);
}

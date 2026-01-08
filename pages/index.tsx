import { useState } from 'react';
import { parseCSVUniversal, parsePDFText } from '../utils/universalParser';
import { findCancelLink } from '../utils/cancelLinks';
import { extractTextFromPDF } from '../utils/pdfParser';

interface RecurringCharge {
  merchant: string;
  amount: number;
  count: number;
  totalSpent: number;
  isSubscription: boolean | null;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [charges, setCharges] = useState<RecurringCharge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'review' | 'results'>('upload');
  const [hasPaid, setHasPaid] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const analyzeCharges = async () => {
    if (files.length === 0) { setError('Please upload a file'); return; }
    setLoading(true);
    setError('');
    try {
      let allTransactions: any[] = [];
      for (const file of files) {
        let transactions: any[] = [];
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const text = await extractTextFromPDF(file);
          transactions = parsePDFText(text);
        } else {
          const text = await file.text();
          transactions = parseCSVUniversal(text);
        }
        allTransactions = [...allTransactions, ...transactions];
      }
      
      if (allTransactions.length === 0) {
        throw new Error('No transactions found. Try a different file.');
      }

      // Group by merchant and find recurring charges
      const merchantMap = new Map<string, { amounts: number[], count: number }>();
      
      for (const t of allTransactions) {
        const key = normalizeMerchant(t.merchant);
        if (!merchantMap.has(key)) {
          merchantMap.set(key, { amounts: [], count: 0 });
        }
        const entry = merchantMap.get(key)!;
        entry.amounts.push(t.amount);
        entry.count++;
      }

      // Convert to recurring charges (show if appears 2+ times OR is known subscription)
      const recurring: RecurringCharge[] = [];
      
      for (const [key, data] of merchantMap.entries()) {
        const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const isKnown = isKnownSubscription(key);
        
        // Include if: appears multiple times, OR is a known subscription, OR amount is subscription-like ($5-$50)
        if (data.count >= 2 || isKnown || (avgAmount >= 5 && avgAmount <= 100)) {
          recurring.push({
            merchant: key,
            amount: avgAmount,
            count: data.count,
            totalSpent: data.amounts.reduce((a, b) => a + b, 0),
            isSubscription: isKnown ? true : null // true = known, null = user decides
          });
        }
      }

      // Sort by total spent descending
      recurring.sort((a, b) => b.totalSpent - a.totalSpent);
      
      if (recurring.length === 0) {
        throw new Error('No recurring charges found.');
      }

      setCharges(recurring);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Error analyzing file');
    } finally {
      setLoading(false);
    }
  };

  const markSubscription = (index: number, isSub: boolean) => {
    const updated = [...charges];
    updated[index].isSubscription = isSub;
    setCharges(updated);
  };

  const confirmSelections = () => {
    setStep('results');
  };

  const getSubscriptions = () => charges.filter(c => c.isSubscription === true);
  
  const getTotalAnnual = () => {
    return getSubscriptions().reduce((sum, c) => sum + (c.amount * 12), 0);
  };

  const reset = () => {
    setStep('upload');
    setHasPaid(false);
    setFiles([]);
    setCharges([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.logo}>stopmysub</h1>
          <p style={styles.tagline}>Find hidden subscriptions. Cancel instantly.</p>
        </div>

        {step === 'upload' && (
          <div style={styles.uploadSection}>
            <div style={styles.uploadBox}>
              <input type="file" accept=".csv,.pdf" multiple onChange={handleFileUpload} style={styles.fileInput} id="file-upload" />
              <label htmlFor="file-upload" style={styles.uploadLabel}>
                <div style={styles.uploadIcon}>📄</div>
                <div style={styles.uploadText}>{files.length === 0 ? 'Drop your bank statement' : files.length + ' file(s) ready'}</div>
                <div style={styles.uploadHint}>CSV or PDF from any bank</div>
              </label>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            {files.length > 0 && <div style={styles.fileList}>{files.map((f, i) => <div key={i} style={styles.fileItem}>📄 {f.name}</div>)}</div>}
            <button onClick={analyzeCharges} disabled={loading || files.length === 0} style={{...styles.button, ...(loading || files.length === 0 ? styles.buttonDisabled : {})}}>
              {loading ? 'Analyzing...' : 'Find My Subscriptions'}
            </button>
            <div style={styles.trust}>🔒 Processed locally. We never see your data.</div>
          </div>
        )}

        {step === 'review' && (
          <div style={styles.reviewSection}>
            <h2 style={styles.reviewTitle}>Is this a subscription?</h2>
            <p style={styles.reviewSubtitle}>We found {charges.length} recurring charges. Help us identify your subscriptions.</p>
            
            <div style={styles.chargesList}>
              {charges.map((charge, i) => (
                <div key={i} style={styles.chargeCard}>
                  <div style={styles.chargeInfo}>
                    <div style={styles.chargeName}>{charge.merchant}</div>
                    <div style={styles.chargeDetails}>
                      ${charge.amount.toFixed(2)} × {charge.count} times = ${charge.totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div style={styles.chargeButtons}>
                    <button 
                      onClick={() => markSubscription(i, true)}
                      style={{
                        ...styles.yesBtn,
                        ...(charge.isSubscription === true ? styles.yesBtnActive : {})
                      }}
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => markSubscription(i, false)}
                      style={{
                        ...styles.noBtn,
                        ...(charge.isSubscription === false ? styles.noBtnActive : {})
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.reviewFooter}>
              <div style={styles.selectedCount}>
                {getSubscriptions().length} subscriptions selected · ${getTotalAnnual().toFixed(0)}/yr
              </div>
              <button onClick={confirmSelections} style={styles.button}>
                Get Cancel Links →
              </button>
            </div>
          </div>
        )}

        {step === 'results' && !hasPaid && (
          <div style={styles.resultsSection}>
            <div style={styles.costCard}>
              <div style={styles.costLabel}>You are spending</div>
              <div style={styles.costAmount}>${getTotalAnnual().toFixed(0)}</div>
              <div style={styles.costPeriod}>per year on subscriptions</div>
            </div>
            <div style={styles.subsCount}>{getSubscriptions().length} subscriptions to cancel</div>
            <div style={styles.previewList}>
              {getSubscriptions().slice(0, 3).map((sub, i) => (
                <div key={i} style={styles.previewItem}>
                  <span>{sub.merchant}</span>
                  <span>${sub.amount.toFixed(2)}/mo</span>
                </div>
              ))}
              {getSubscriptions().length > 3 && <div style={styles.moreItems}>+{getSubscriptions().length - 3} more...</div>}
            </div>
            <button onClick={() => setHasPaid(true)} style={styles.payButton}>
              Unlock Cancel Links — $5
            </button>
            <div style={styles.guarantee}>💰 Money back if you don't save at least $100</div>
          </div>
        )}

        {step === 'results' && hasPaid && (
          <div style={styles.resultsSection}>
            <div style={styles.costCard}>
              <div style={styles.costLabel}>Total Annual Savings</div>
              <div style={styles.costAmount}>${getTotalAnnual().toFixed(0)}</div>
              <div style={styles.costPeriod}>if you cancel all {getSubscriptions().length} subscriptions</div>
            </div>
            <div style={styles.subsList}>
              {getSubscriptions().map((sub, i) => {
                const cancelLink = findCancelLink(sub.merchant);
                return (
                  <div key={i} style={styles.subCard}>
                    <div style={styles.subInfo}>
                      <div style={styles.subName}>{sub.merchant}</div>
                      <div style={styles.subDetails}>${sub.amount.toFixed(2)}/mo · ${(sub.amount * 12).toFixed(0)}/yr</div>
                    </div>
                    {cancelLink ? (
                      <a href={cancelLink.url} target="_blank" rel="noopener noreferrer" style={styles.cancelBtn}>Cancel</a>
                    ) : (
                      <a href={'https://google.com/search?q=how+to+cancel+' + encodeURIComponent(sub.merchant) + '+subscription'} target="_blank" rel="noopener noreferrer" style={styles.cancelBtnAlt}>How to cancel</a>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={reset} style={styles.resetBtn}>Analyze Another Statement</button>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ');
}

const KNOWN_SUBS = ['netflix', 'spotify', 'apple', 'amazon', 'hulu', 'disney', 'youtube', 'hbo', 'max',
  'paramount', 'peacock', 'doordash', 'dashpass', 'uber', 'uber one', 'lyft', 'playstation', 'xbox', 
  'nintendo', 'adobe', 'microsoft', 'google', 'prime', 'audible', 'kindle', 'grubhub', 'instacart', 
  'walmart', 'costco', 'gym', 'fitness', 'planet fitness', 'la fitness', 'equinox', 'tradingview', 
  'chatgpt', 'openai', 'github', 'dropbox', 'icloud', 'tiktok', 'facebook', 'facebk', 'linkedin',
  'canva', 'notion', 'slack', 'zoom', 'nordvpn', 'expressvpn', 'sirius', 'pandora', 'tidal',
  'crunchyroll', 'funimation', 'headspace', 'calm', 'noom', 'peloton', 'strava', 'duolingo',
  'grammarly', 'medium', 'substack', 'patreon', 'onlyfans', 'twitch'];

function isKnownSubscription(merchant: string): boolean {
  const lower = merchant.toLowerCase();
  return KNOWN_SUBS.some(sub => lower.includes(sub));
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  content: { maxWidth: '520px', margin: '0 auto', padding: '40px 20px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '28px', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  tagline: { fontSize: '14px', color: '#888', marginTop: '6px' },
  uploadSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  uploadBox: { border: '2px dashed #333', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#111' },
  fileInput: { display: 'none' },
  uploadLabel: { cursor: 'pointer', display: 'block' },
  uploadIcon: { fontSize: '40px', marginBottom: '12px' },
  uploadText: { fontSize: '16px', fontWeight: '500', marginBottom: '6px' },
  uploadHint: { fontSize: '13px', color: '#666' },
  error: { background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' },
  fileList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fileItem: { background: '#1a1a1a', padding: '10px 14px', borderRadius: '8px', color: '#ccc', fontSize: '14px' },
  button: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  trust: { textAlign: 'center', fontSize: '12px', color: '#666' },
  
  reviewSection: { },
  reviewTitle: { fontSize: '20px', fontWeight: '600', marginBottom: '4px', textAlign: 'center' },
  reviewSubtitle: { fontSize: '14px', color: '#888', marginBottom: '20px', textAlign: 'center' },
  chargesList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' },
  chargeCard: { background: '#111', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  chargeInfo: { flex: 1 },
  chargeName: { fontSize: '15px', fontWeight: '500', marginBottom: '2px', textTransform: 'capitalize' },
  chargeDetails: { fontSize: '13px', color: '#888' },
  chargeButtons: { display: 'flex', gap: '8px' },
  yesBtn: { padding: '8px 16px', background: '#222', color: '#888', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  yesBtnActive: { background: '#00ff88', color: '#000' },
  noBtn: { padding: '8px 16px', background: '#222', color: '#888', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  noBtnActive: { background: '#ff4444', color: '#fff' },
  reviewFooter: { borderTop: '1px solid #222', paddingTop: '16px' },
  selectedCount: { textAlign: 'center', fontSize: '14px', color: '#888', marginBottom: '12px' },
  
  resultsSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  costCard: { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '20px', padding: '28px', textAlign: 'center' },
  costLabel: { fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
  costAmount: { fontSize: '56px', fontWeight: '700', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '6px 0' },
  costPeriod: { fontSize: '14px', color: '#666' },
  subsCount: { textAlign: 'center', fontSize: '16px', fontWeight: '500' },
  previewList: { background: '#111', borderRadius: '12px', overflow: 'hidden', filter: 'blur(4px)' },
  previewItem: { display: 'flex', justifyContent: 'space-between', padding: '14px', borderBottom: '1px solid #222', fontSize: '14px' },
  moreItems: { padding: '14px', textAlign: 'center', color: '#666', fontSize: '13px' },
  payButton: { width: '100%', padding: '16px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  guarantee: { textAlign: 'center', fontSize: '13px', color: '#666' },
  subsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  subCard: { background: '#111', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subInfo: { flex: 1 },
  subName: { fontSize: '15px', fontWeight: '500', marginBottom: '2px', textTransform: 'capitalize' },
  subDetails: { fontSize: '13px', color: '#888' },
  cancelBtn: { padding: '8px 14px', background: '#ff4444', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' },
  cancelBtnAlt: { padding: '8px 14px', background: '#333', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' },
  resetBtn: { width: '100%', padding: '12px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' },
};

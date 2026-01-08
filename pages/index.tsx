import { useState } from 'react';
import { parseCSVUniversal, parsePDFText, detectSubscriptions, calculateTotalAnnualCost, Subscription, Transaction } from '../utils/subscriptionDetector';
import { findCancelLink } from '../utils/cancelLinks';
import { extractTextFromPDF } from '../utils/pdfParser';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalAnnualCost, setTotalAnnualCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const analyzeSubscriptions = async () => {
    if (files.length === 0) { setError('Please upload a file'); return; }
    setLoading(true);
    setError('');
    try {
      let allTransactions: Transaction[] = [];
      for (const file of files) {
        let transactions: Transaction[] = [];
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const text = await extractTextFromPDF(file);
          console.log('Extracted PDF text:', text.substring(0, 1000));
          transactions = parsePDFText(text);
          console.log('Parsed transactions:', transactions.length);
        } else {
          const text = await file.text();
          transactions = parseCSVUniversal(text);
        }
        allTransactions = [...allTransactions, ...transactions];
      }
      if (allTransactions.length === 0) throw new Error('No transactions found. Try a different file format.');
      const detected = detectSubscriptions(allTransactions);
      if (detected.length === 0) throw new Error('No recurring subscriptions detected.');
      setSubscriptions(detected);
      setTotalAnnualCost(calculateTotalAnnualCost(detected));
      setShowResults(true);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error analyzing file');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setShowResults(false); setHasPaid(false); setFiles([]); setSubscriptions([]); };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.logo}>stopmysub</h1>
          <p style={styles.tagline}>Find hidden subscriptions. Cancel instantly.</p>
        </div>

        {!showResults ? (
          <div style={styles.uploadSection}>
            <div style={styles.uploadBox}>
              <input type="file" accept=".csv,.pdf" multiple onChange={handleFileUpload} style={styles.fileInput} id="file-upload" />
              <label htmlFor="file-upload" style={styles.uploadLabel}>
                <div style={styles.uploadIcon}>📄</div>
                <div style={styles.uploadText}>{files.length === 0 ? 'Upload your bank statement' : files.length + ' file(s) ready'}</div>
                <div style={styles.uploadHint}>CSV or PDF from any bank</div>
              </label>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            {files.length > 0 && <div style={styles.fileList}>{files.map((f, i) => <div key={i} style={styles.fileItem}>📄 {f.name}</div>)}</div>}
            <button onClick={analyzeSubscriptions} disabled={loading || files.length === 0} style={{...styles.button, ...(loading || files.length === 0 ? styles.buttonDisabled : {})}}>
              {loading ? 'Analyzing...' : 'Find My Subscriptions'}
            </button>
            <div style={styles.trust}>🔒 Processed locally. We never see your data.</div>
          </div>
        ) : !hasPaid ? (
          <div style={styles.resultsSection}>
            <div style={styles.costCard}>
              <div style={styles.costLabel}>You are spending</div>
              <div style={styles.costAmount}>${totalAnnualCost.toFixed(0)}</div>
              <div style={styles.costPeriod}>per year on subscriptions</div>
            </div>
            <div style={styles.subsCount}>{subscriptions.length} subscriptions found</div>
            <div style={styles.previewList}>
              {subscriptions.slice(0, 3).map((sub, i) => <div key={i} style={styles.previewItem}><span>{sub.merchant}</span><span>${sub.amount.toFixed(2)}/mo</span></div>)}
              {subscriptions.length > 3 && <div style={styles.moreItems}>+{subscriptions.length - 3} more...</div>}
            </div>
            <button onClick={() => setHasPaid(true)} style={styles.payButton}>Unlock All + Cancel Links — $5</button>
            <div style={styles.guarantee}>💰 Find $100+ in savings or money back</div>
          </div>
        ) : (
          <div style={styles.resultsSection}>
            <div style={styles.costCard}>
              <div style={styles.costLabel}>Total Annual Cost</div>
              <div style={styles.costAmount}>${totalAnnualCost.toFixed(0)}</div>
              <div style={styles.costPeriod}>${(totalAnnualCost / 12).toFixed(2)}/month</div>
            </div>
            <div style={styles.subsList}>
              {subscriptions.map((sub, i) => {
                const cancelLink = findCancelLink(sub.merchant);
                return (
                  <div key={i} style={styles.subCard}>
                    <div style={styles.subInfo}>
                      <div style={styles.subName}>{sub.merchant}</div>
                      <div style={styles.subDetails}>${sub.amount.toFixed(2)}/mo · ${sub.annualCost.toFixed(0)}/yr</div>
                    </div>
                    {cancelLink ? (
                      <a href={cancelLink.url} target="_blank" rel="noopener noreferrer" style={styles.cancelBtn}>Cancel</a>
                    ) : (
                      <a href={'https://google.com/search?q=cancel+' + encodeURIComponent(sub.merchant)} target="_blank" rel="noopener noreferrer" style={styles.cancelBtnAlt}>How to cancel</a>
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

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  content: { maxWidth: '480px', margin: '0 auto', padding: '60px 20px' },
  header: { textAlign: 'center', marginBottom: '48px' },
  logo: { fontSize: '32px', fontWeight: '700', margin: 0, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  tagline: { fontSize: '16px', color: '#888', marginTop: '8px' },
  uploadSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  uploadBox: { border: '2px dashed #333', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: '#111' },
  fileInput: { display: 'none' },
  uploadLabel: { cursor: 'pointer', display: 'block' },
  uploadIcon: { fontSize: '48px', marginBottom: '16px' },
  uploadText: { fontSize: '18px', fontWeight: '500', marginBottom: '8px' },
  uploadHint: { fontSize: '14px', color: '#666' },
  error: { background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', color: '#ff6b6b', padding: '12px 16px', borderRadius: '8px' },
  fileList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fileItem: { background: '#1a1a1a', padding: '12px 16px', borderRadius: '8px', color: '#ccc' },
  button: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  buttonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  trust: { textAlign: 'center', fontSize: '13px', color: '#666' },
  resultsSection: { display: 'flex', flexDirection: 'column', gap: '24px' },
  costCard: { background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderRadius: '20px', padding: '32px', textAlign: 'center' },
  costLabel: { fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' },
  costAmount: { fontSize: '64px', fontWeight: '700', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '8px 0' },
  costPeriod: { fontSize: '16px', color: '#666' },
  subsCount: { textAlign: 'center', fontSize: '18px', fontWeight: '500' },
  previewList: { background: '#111', borderRadius: '12px', overflow: 'hidden', filter: 'blur(4px)' },
  previewItem: { display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #222' },
  moreItems: { padding: '16px', textAlign: 'center', color: '#666' },
  payButton: { width: '100%', padding: '18px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  guarantee: { textAlign: 'center', fontSize: '14px', color: '#666' },
  subsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  subCard: { background: '#111', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  subInfo: { flex: 1 },
  subName: { fontSize: '16px', fontWeight: '500', marginBottom: '4px' },
  subDetails: { fontSize: '14px', color: '#888' },
  cancelBtn: { padding: '8px 16px', background: '#ff4444', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  cancelBtnAlt: { padding: '8px 16px', background: '#333', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' },
  resetBtn: { width: '100%', padding: '14px', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '12px', cursor: 'pointer' },
};

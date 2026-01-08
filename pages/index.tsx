import { useState } from 'react';
import { parseCSV, detectSubscriptions, calculateTotalAnnualCost, Subscription } from '../utils/subscriptionDetector';
import { findCancelLink } from '../utils/cancelLinks';

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
      const uploadedFiles = Array.from(e.target.files);
      setFiles(uploadedFiles);
      setError('');
    }
  };

  const analyzeSubscriptions = async () => {
    if (files.length === 0) {
      setError('Please upload at least one CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let allTransactions: any[] = [];

      // Parse all uploaded CSV files
      for (const file of files) {
        const text = await file.text();
        const transactions = parseCSV(text);
        allTransactions = [...allTransactions, ...transactions];
      }

      if (allTransactions.length === 0) {
        throw new Error('No valid transactions found in uploaded files');
      }

      // Detect subscriptions
      const detected = detectSubscriptions(allTransactions);
      const total = calculateTotalAnnualCost(detected);

      setSubscriptions(detected);
      setTotalAnnualCost(total);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || 'Error analyzing files. Please check CSV format.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    // In production, this would integrate with Stripe
    // For now, we'll simulate payment
    setHasPaid(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>💳 Subscription Tracker</h1>
        <p style={styles.subtitle}>
          Upload 3 months of credit card statements and discover how much you're really spending on subscriptions
        </p>

        {!showResults && (
          <div style={styles.uploadSection}>
            <div style={styles.uploadBox}>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                style={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={styles.uploadLabel}>
                <div style={styles.uploadIcon}>📁</div>
                <div>
                  {files.length === 0 
                    ? 'Click to upload CSV files' 
                    : `${files.length} file(s) selected`}
                </div>
                <div style={styles.uploadHint}>
                  Upload your credit card CSV exports (last 3 months recommended)
                </div>
              </label>
            </div>

            {error && (
              <div style={styles.error}>
                ⚠️ {error}
              </div>
            )}

            {files.length > 0 && (
              <div style={styles.fileList}>
                <strong>Selected files:</strong>
                <ul>
                  {files.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={analyzeSubscriptions}
              disabled={loading || files.length === 0}
              style={{
                ...styles.button,
                ...(loading || files.length === 0 ? styles.buttonDisabled : {})
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze My Subscriptions'}
            </button>

            <div style={styles.privacy}>
              🔒 Your data is processed locally and never stored on our servers
            </div>
          </div>
        )}

        {showResults && !hasPaid && (
          <div style={styles.resultsPreview}>
            <div style={styles.totalCost}>
              <h2>Your Annual Subscription Cost</h2>
              <div style={styles.bigNumber}>
                ${totalAnnualCost.toFixed(2)}
              </div>
              <p style={styles.perMonth}>
                (${(totalAnnualCost / 12).toFixed(2)}/month)
              </p>
            </div>

            <div style={styles.subsFound}>
              <strong>{subscriptions.length} subscriptions detected</strong>
            </div>

            <div style={styles.blurredPreview}>
              {subscriptions.slice(0, 3).map((sub, idx) => (
                <div key={idx} style={styles.subPreviewItem}>
                  <div style={styles.subName}>{sub.merchant}</div>
                  <div style={styles.subAmount}>
                    ${sub.amount.toFixed(2)}/{sub.frequency === 'monthly' ? 'mo' : sub.frequency === 'quarterly' ? 'qtr' : 'yr'}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={styles.unlockMessage}>
              <h3>🔓 Unlock Full Report</h3>
              <p>Get instant cancel links for all {subscriptions.length} subscriptions</p>
              <button onClick={handlePayment} style={styles.payButton}>
                Pay $5 to View Full Report
              </button>
            </div>
          </div>
        )}

        {showResults && hasPaid && (
          <div style={styles.fullResults}>
            <div style={styles.totalCost}>
              <h2>Your Annual Subscription Cost</h2>
              <div style={styles.bigNumber}>
                ${totalAnnualCost.toFixed(2)}
              </div>
              <p style={styles.perMonth}>
                (${(totalAnnualCost / 12).toFixed(2)}/month)
              </p>
            </div>

            <div style={styles.subscriptionList}>
              <h3>All Your Subscriptions ({subscriptions.length})</h3>
              
              {subscriptions.map((sub, idx) => {
                const cancelLink = findCancelLink(sub.merchant);
                
                return (
                  <div key={idx} style={styles.subscriptionCard}>
                    <div style={styles.subHeader}>
                      <div>
                        <div style={styles.subMerchant}>{sub.merchant}</div>
                        <div style={styles.subFrequency}>
                          {sub.frequency} • {sub.transactions.length} charges detected
                        </div>
                      </div>
                      <div style={styles.subCost}>
                        <div style={styles.subMonthly}>
                          ${sub.amount.toFixed(2)}/{sub.frequency === 'monthly' ? 'mo' : sub.frequency === 'quarterly' ? 'qtr' : 'yr'}
                        </div>
                        <div style={styles.subAnnual}>
                          ${sub.annualCost.toFixed(2)}/year
                        </div>
                      </div>
                    </div>

                    {cancelLink ? (
                      <div style={styles.cancelSection}>
                        <a 
                          href={cancelLink.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.cancelButton}
                        >
                          ✂️ Cancel This Subscription
                        </a>
                        {cancelLink.instructions && (
                          <div style={styles.instructions}>
                            💡 {cancelLink.instructions}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={styles.noCancelLink}>
                        ℹ️ Search "{sub.merchant} cancel subscription" to find cancellation page
                      </div>
                    )}

                    <div style={styles.confidence}>
                      Confidence: {(sub.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => {
                setShowResults(false);
                setHasPaid(false);
                setFiles([]);
                setSubscriptions([]);
              }}
              style={styles.resetButton}
            >
              Analyze Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: '40px'
  },
  uploadSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  uploadBox: {
    border: '3px dashed #667eea',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    cursor: 'pointer',
    display: 'block'
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  uploadHint: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px'
  },
  fileList: {
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  button: {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  privacy: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    marginTop: '20px'
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  resultsPreview: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  totalCost: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  bigNumber: {
    fontSize: '64px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '20px 0'
  },
  perMonth: {
    fontSize: '18px',
    color: '#666'
  },
  subsFound: {
    textAlign: 'center',
    fontSize: '18px',
    marginBottom: '30px',
    color: '#333'
  },
  blurredPreview: {
    filter: 'blur(5px)',
    marginBottom: '20px',
    pointerEvents: 'none'
  },
  subPreviewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    background: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  subName: {
    fontWeight: '600'
  },
  subAmount: {
    color: '#667eea'
  },
  unlockMessage: {
    textAlign: 'center',
    padding: '30px 20px',
    background: 'white',
    borderRadius: '12px'
  },
  payButton: {
    padding: '16px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  },
  fullResults: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  subscriptionList: {
    marginTop: '40px'
  },
  subscriptionCard: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '2px solid #eee'
  },
  subHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '15px'
  },
  subMerchant: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  subFrequency: {
    fontSize: '14px',
    color: '#666'
  },
  subCost: {
    textAlign: 'right'
  },
  subMonthly: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  subAnnual: {
    fontSize: '14px',
    color: '#666'
  },
  cancelSection: {
    marginTop: '15px'
  },
  cancelButton: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#ff4757',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  instructions: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic'
  },
  noCancelLink: {
    padding: '12px',
    background: '#fff3cd',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#856404'
  },
  confidence: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#999'
  },
  resetButton: {
    width: '100%',
    padding: '14px',
    background: '#f1f1f1',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '30px',
    color: '#333'
  }
};

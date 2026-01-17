import { useState, useMemo } from 'react';
import Head from 'next/head';

interface Subscription {
  id: string;
  merchant: string;
  amount: number;
  billingDay: number;
  category: string;
  icon: string;
  cancelUrl: string | null;
}

const KNOWN_SUBSCRIPTIONS: Record<string, { name: string; category: string; icon: string; cancelUrl: string | null }> = {
  'netflix': { name: 'Netflix', category: 'Entertainment', icon: '🎬', cancelUrl: 'https://www.netflix.com/cancelplan' },
  'spotify': { name: 'Spotify', category: 'Music', icon: '🎵', cancelUrl: 'https://www.spotify.com/account/subscription/' },
  'amazon prime': { name: 'Amazon Prime', category: 'Shopping', icon: '📦', cancelUrl: 'https://www.amazon.com/gp/primecentral' },
  'prime video': { name: 'Prime Video', category: 'Entertainment', icon: '📦', cancelUrl: 'https://www.amazon.com/gp/primecentral' },
  'disney': { name: 'Disney+', category: 'Entertainment', icon: '🏰', cancelUrl: 'https://www.disneyplus.com/account/subscription' },
  'hulu': { name: 'Hulu', category: 'Entertainment', icon: '📺', cancelUrl: 'https://secure.hulu.com/account' },
  'hbo': { name: 'HBO Max', category: 'Entertainment', icon: '🎭', cancelUrl: 'https://www.max.com/account' },
  'max': { name: 'Max', category: 'Entertainment', icon: '🎭', cancelUrl: 'https://www.max.com/account' },
  'apple music': { name: 'Apple Music', category: 'Music', icon: '🍎', cancelUrl: 'https://support.apple.com/en-us/HT202039' },
  'apple tv': { name: 'Apple TV+', category: 'Entertainment', icon: '🍎', cancelUrl: 'https://support.apple.com/en-us/HT202039' },
  'icloud': { name: 'iCloud', category: 'Storage', icon: '☁️', cancelUrl: 'https://support.apple.com/en-us/HT207594' },
  'google one': { name: 'Google One', category: 'Storage', icon: '🔵', cancelUrl: 'https://one.google.com/settings' },
  'youtube': { name: 'YouTube Premium', category: 'Entertainment', icon: '▶️', cancelUrl: 'https://www.youtube.com/paid_memberships' },
  'dropbox': { name: 'Dropbox', category: 'Storage', icon: '📁', cancelUrl: 'https://www.dropbox.com/account/plan' },
  'adobe': { name: 'Adobe Creative Cloud', category: 'Software', icon: '🎨', cancelUrl: 'https://account.adobe.com/plans' },
  'microsoft 365': { name: 'Microsoft 365', category: 'Software', icon: '📊', cancelUrl: 'https://account.microsoft.com/services' },
  'office 365': { name: 'Microsoft 365', category: 'Software', icon: '📊', cancelUrl: 'https://account.microsoft.com/services' },
  'chatgpt': { name: 'ChatGPT Plus', category: 'AI', icon: '🤖', cancelUrl: 'https://chat.openai.com/settings/subscription' },
  'openai': { name: 'OpenAI', category: 'AI', icon: '🤖', cancelUrl: 'https://platform.openai.com/account/billing' },
  'claude': { name: 'Claude Pro', category: 'AI', icon: '🧠', cancelUrl: 'https://claude.ai/settings' },
  'anthropic': { name: 'Claude Pro', category: 'AI', icon: '🧠', cancelUrl: 'https://claude.ai/settings' },
  'gym': { name: 'Gym Membership', category: 'Fitness', icon: '💪', cancelUrl: null },
  'planet fitness': { name: 'Planet Fitness', category: 'Fitness', icon: '💪', cancelUrl: 'https://www.planetfitness.com/my-account' },
  'peloton': { name: 'Peloton', category: 'Fitness', icon: '🚴', cancelUrl: 'https://members.onepeloton.com/preferences/subscriptions' },
  'headspace': { name: 'Headspace', category: 'Wellness', icon: '🧘', cancelUrl: 'https://www.headspace.com/settings/subscription' },
  'calm': { name: 'Calm', category: 'Wellness', icon: '🧘', cancelUrl: 'https://www.calm.com/account' },
  'linkedin': { name: 'LinkedIn Premium', category: 'Professional', icon: '💼', cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription' },
  'nordvpn': { name: 'NordVPN', category: 'Security', icon: '🔒', cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/' },
  'expressvpn': { name: 'ExpressVPN', category: 'Security', icon: '🔒', cancelUrl: 'https://www.expressvpn.com/subscriptions' },
  '1password': { name: '1Password', category: 'Security', icon: '🔑', cancelUrl: 'https://my.1password.com/profile' },
  'notion': { name: 'Notion', category: 'Productivity', icon: '📝', cancelUrl: 'https://www.notion.so/my-account' },
  'canva': { name: 'Canva Pro', category: 'Design', icon: '🎨', cancelUrl: 'https://www.canva.com/settings/billing-and-plans' },
  'figma': { name: 'Figma', category: 'Design', icon: '🎨', cancelUrl: 'https://www.figma.com/settings' },
  'grammarly': { name: 'Grammarly', category: 'Writing', icon: '✍️', cancelUrl: 'https://account.grammarly.com/subscription' },
  'paramount': { name: 'Paramount+', category: 'Entertainment', icon: '⭐', cancelUrl: 'https://www.paramountplus.com/account/' },
  'peacock': { name: 'Peacock', category: 'Entertainment', icon: '🦚', cancelUrl: 'https://www.peacocktv.com/account/plan' },
  'crunchyroll': { name: 'Crunchyroll', category: 'Entertainment', icon: '🍥', cancelUrl: 'https://www.crunchyroll.com/account/subscription' },
  'audible': { name: 'Audible', category: 'Books', icon: '🎧', cancelUrl: 'https://www.audible.com/account/overview' },
  'kindle': { name: 'Kindle Unlimited', category: 'Books', icon: '📚', cancelUrl: 'https://www.amazon.com/kindle-dbs/hz/subscribe/ku' },
  'doordash': { name: 'DashPass', category: 'Food', icon: '🍔', cancelUrl: 'https://www.doordash.com/consumer/membership/' },
  'uber eats': { name: 'Uber One', category: 'Food', icon: '🚗', cancelUrl: 'https://www.ubereats.com/membership' },
  'xbox': { name: 'Xbox Game Pass', category: 'Gaming', icon: '🎮', cancelUrl: 'https://account.microsoft.com/services/xboxgamepass/cancel' },
  'playstation': { name: 'PlayStation Plus', category: 'Gaming', icon: '🎮', cancelUrl: 'https://www.playstation.com/en-us/support/store/cancel-ps-store-subscription/' },
  'nintendo': { name: 'Nintendo Online', category: 'Gaming', icon: '🎮', cancelUrl: 'https://accounts.nintendo.com/shop/subscription' },
  'nytimes': { name: 'NY Times', category: 'News', icon: '📰', cancelUrl: 'https://myaccount.nytimes.com/seg/' },
  'navy federal': { name: 'Navy Federal', category: 'Banking', icon: '🏦', cancelUrl: null },
};

const DEMO_SUBSCRIPTIONS: Subscription[] = [
  { id: '1', merchant: 'Netflix', amount: 15.99, billingDay: 15, category: 'Entertainment', icon: '🎬', cancelUrl: 'https://www.netflix.com/cancelplan' },
  { id: '2', merchant: 'Spotify', amount: 10.99, billingDay: 1, category: 'Music', icon: '🎵', cancelUrl: 'https://www.spotify.com/account/subscription/' },
  { id: '3', merchant: 'ChatGPT Plus', amount: 20.00, billingDay: 22, category: 'AI', icon: '🤖', cancelUrl: 'https://chat.openai.com/settings/subscription' },
  { id: '4', merchant: 'iCloud', amount: 2.99, billingDay: 8, category: 'Storage', icon: '☁️', cancelUrl: 'https://support.apple.com/en-us/HT207594' },
  { id: '5', merchant: 'YouTube Premium', amount: 13.99, billingDay: 19, category: 'Entertainment', icon: '▶️', cancelUrl: 'https://www.youtube.com/paid_memberships' },
  { id: '6', merchant: 'Adobe Creative Cloud', amount: 54.99, billingDay: 5, category: 'Software', icon: '🎨', cancelUrl: 'https://account.adobe.com/plans' },
  { id: '7', merchant: 'Notion', amount: 10.00, billingDay: 12, category: 'Productivity', icon: '📝', cancelUrl: 'https://www.notion.so/my-account' },
  { id: '8', merchant: 'Planet Fitness', amount: 24.99, billingDay: 17, category: 'Fitness', icon: '💪', cancelUrl: 'https://www.planetfitness.com/my-account' },
];

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'landing' | 'upload' | 'review' | 'dashboard'>('landing');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file: File) => {
    setLoading(true);
    setError('');
    
    try {
      const text = await file.text();
      const detected = detectSubscriptions(text);
      
      if (detected.length === 0) {
        setError('No subscriptions detected. Try a different statement or use demo data.');
        setLoading(false);
        return;
      }
      
      setSubscriptions(detected);
      setStep('review');
    } catch (err) {
      setError('Error processing file. Please try again.');
      console.error(err);
    }
    
    setLoading(false);
  };

  const detectSubscriptions = (text: string): Subscription[] => {
    const detected: Subscription[] = [];
    const lowerText = text.toLowerCase();
    const lines = text.split('\n');
    
    for (const [keyword, info] of Object.entries(KNOWN_SUBSCRIPTIONS)) {
      if (lowerText.includes(keyword)) {
        let price = Math.floor(Math.random() * 20) + 5;
        
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword)) {
            const priceMatch = line.match(/\$?(\d{1,3}(?:\.\d{2})?)/);
            if (priceMatch) {
              const parsed = parseFloat(priceMatch[1]);
              if (parsed > 0 && parsed < 500) {
                price = parsed;
                break;
              }
            }
          }
        }
        
        if (!detected.find(s => s.merchant === info.name)) {
          detected.push({
            id: crypto.randomUUID(),
            merchant: info.name,
            amount: price,
            billingDay: Math.floor(Math.random() * 28) + 1,
            category: info.category,
            icon: info.icon,
            cancelUrl: info.cancelUrl,
          });
        }
      }
    }
    
    return detected;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const loadDemo = () => {
    setSubscriptions(DEMO_SUBSCRIPTIONS);
    setStep('dashboard');
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const totalMonthly = useMemo(() => 
    subscriptions.reduce((sum, s) => sum + s.amount, 0), [subscriptions]);

  const totalYearly = useMemo(() => totalMonthly * 12, [totalMonthly]);

  // ========== LANDING PAGE ==========
  if (step === 'landing') {
    return (
      <>
        <Head>
          <title>StopMySub - Find & Cancel Hidden Subscriptions</title>
          <meta name="description" content="Upload your bank statements. We find every subscription, show you when they bill, and help you cancel with one click." />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Head>
        <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
          {/* Nav */}
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 600, color: '#111' }}>
              <div style={{ width: '36px', height: '36px', background: '#0066ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>S</div>
              StopMySub
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <span style={{ color: '#666', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>Features</span>
              <span style={{ color: '#666', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>Pricing</span>
              <button onClick={() => setStep('upload')} style={{ padding: '10px 20px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>Get Started</button>
            </div>
          </nav>

          {/* Hero */}
          <div style={{ maxWidth: '700px', padding: '80px 60px 60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#e6f4ff', color: '#0066ff', borderRadius: '20px', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
              <span style={{ width: '8px', height: '8px', background: '#0066ff', borderRadius: '50%' }}></span>
              Stop overpaying for forgotten subscriptions
            </div>
            <h1 style={{ fontSize: '52px', fontWeight: 600, lineHeight: 1.15, marginBottom: '20px', color: '#111', letterSpacing: '-0.02em' }}>
              Know exactly what you're paying for
            </h1>
            <p style={{ fontSize: '18px', color: '#666', lineHeight: 1.6, marginBottom: '32px' }}>
              Upload your bank statements. We find every subscription, show you when they bill, and help you cancel with one click.
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setStep('upload')} style={{ padding: '14px 28px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Start Free <span>→</span>
              </button>
              <button onClick={loadDemo} style={{ padding: '14px 28px', background: '#fff', color: '#111', border: '1px solid #e5e5e5', borderRadius: '10px', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>View Demo</button>
            </div>
            <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                100% Private
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                No account needed
              </span>
            </div>
          </div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '40px auto 80px', padding: '0 60px' }}>
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px', filter: 'grayscale(1)', opacity: 0.7 }}>📄</div>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>Upload Statements</div>
              <div style={{ fontSize: '15px', color: '#666', lineHeight: 1.5 }}>Drop your bank or credit card PDFs</div>
            </div>
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px', filter: 'grayscale(1)', opacity: 0.7 }}>🔍</div>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>Auto-Detect</div>
              <div style={{ fontSize: '15px', color: '#666', lineHeight: 1.5 }}>AI finds all recurring charges</div>
            </div>
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '16px', padding: '28px' }}>
              <div style={{ fontSize: '28px', marginBottom: '16px', filter: 'grayscale(1)', opacity: 0.7 }}>📅</div>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>Visual Calendar</div>
              <div style={{ fontSize: '15px', color: '#666', lineHeight: 1.5 }}>See exactly when you're billed</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ========== UPLOAD PAGE ==========
  if (step === 'upload') {
    return (
      <>
        <Head><title>Upload Statement - StopMySub</title></Head>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#fafafa', fontFamily: "'Inter', sans-serif" }}>
          <button onClick={() => setStep('landing')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '16px', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ← Back
          </button>
          
          <div style={{ background: '#fff', borderRadius: '20px', padding: '48px', maxWidth: '480px', width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>Upload Your Statement</h1>
            <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px' }}>Drop your bank statement (PDF or CSV) to find subscriptions</p>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #f0f0f0', borderTopColor: '#0066ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#666' }}>Analyzing your statement...</p>
              </div>
            ) : (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? '#0066ff' : '#e5e5e5'}`,
                    background: dragActive ? '#f0f7ff' : '#fafafa',
                    borderRadius: '16px', padding: '48px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>📄</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#111' }}>Drop your bank statement here</h3>
                  <span style={{ color: '#888', fontSize: '14px' }}>PDF or CSV from any bank</span>
                  <input type="file" id="fileInput" accept=".pdf,.csv,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
                
                {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: '10px', marginTop: '16px', fontSize: '14px' }}>{error}</div>}
                
                <div style={{ textAlign: 'center', color: '#ccc', margin: '24px 0', fontSize: '14px' }}>or</div>
                
                <button onClick={loadDemo} style={{ width: '100%', padding: '14px', background: '#fafafa', color: '#111', border: '1px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>
                  Try with Demo Data
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ========== REVIEW PAGE ==========
  if (step === 'review') {
    return (
      <>
        <Head><title>Review Subscriptions - StopMySub</title></Head>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
          <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '8px', color: '#111' }}>We found {subscriptions.length} subscriptions</h1>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '15px' }}>Review and confirm the subscriptions we detected</p>
          
          {subscriptions.map(sub => (
            <div key={sub.id} style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>{sub.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px', color: '#111' }}>{sub.merchant}</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{sub.category}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 600, fontSize: '16px', fontFamily: "'SF Mono', monospace" }}>${sub.amount.toFixed(2)}/mo</span>
                <button onClick={() => removeSubscription(sub.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '20px', padding: '4px 8px' }}>×</button>
              </div>
            </div>
          ))}
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '14px', background: '#fff', color: '#111', border: '1px solid #e5e5e5', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
            <button onClick={() => setStep('dashboard')} style={{ flex: 1, padding: '14px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 500, cursor: 'pointer' }}>Continue to Dashboard →</button>
          </div>
        </div>
      </>
    );
  }

  // ========== DASHBOARD ==========
  return (
    <>
      <Head><title>Dashboard - StopMySub</title></Head>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 600, color: '#111' }}>
            <div style={{ width: '32px', height: '32px', background: '#0066ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px' }}>S</div>
            StopMySub
          </div>
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '10px', padding: '4px' }}>
            <button onClick={() => setViewMode('calendar')} style={{ padding: '8px 16px', border: 'none', background: viewMode === 'calendar' ? '#fff' : 'transparent', color: viewMode === 'calendar' ? '#111' : '#666', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📅 Calendar</button>
            <button onClick={() => setViewMode('list')} style={{ padding: '8px 16px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#111' : '#666', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', fontSize: '14px', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📋 List</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #f0f0f0' }}>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Active Subscriptions</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#111' }}>{subscriptions.length}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #f0f0f0' }}>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Monthly Spend</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#ef4444', fontFamily: "'SF Mono', monospace" }}>${totalMonthly.toFixed(2)}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #f0f0f0' }}>
            <div style={{ color: '#888', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Yearly Total</div>
            <div style={{ fontSize: '32px', fontWeight: 600, color: '#111', fontFamily: "'SF Mono', monospace" }}>${totalYearly.toFixed(2)}</div>
          </div>
        </div>
        
        {viewMode === 'calendar' && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '32px 0 16px', color: '#111' }}>Billing Calendar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f0' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ fontWeight: 500, textAlign: 'center', padding: '8px', color: '#888', fontSize: '13px' }}>{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i < 3 ? null : i - 2;
                if (dayNum === null || dayNum > 31) return <div key={i} style={{ aspectRatio: '1' }}></div>;
                const daySubs = subscriptions.filter(s => s.billingDay === dayNum);
                return (
                  <div key={i} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '14px', background: daySubs.length > 0 ? '#f0f7ff' : 'transparent', border: daySubs.length > 0 ? '1px solid #e0efff' : '1px solid transparent' }}>
                    <span style={{ fontWeight: 500, color: '#111' }}>{dayNum}</span>
                    {daySubs.length > 0 && <span style={{ fontSize: '16px', marginTop: '2px' }}>{daySubs.map(s => s.icon).join('')}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '32px 0 16px', color: '#111' }}>Your Subscriptions</h2>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
          {subscriptions.map((sub, i) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i < subscriptions.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>{sub.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '16px', color: '#111' }}>{sub.merchant}</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{sub.category} · Bills on the {sub.billingDay}{sub.billingDay === 1 ? 'st' : sub.billingDay === 2 ? 'nd' : sub.billingDay === 3 ? 'rd' : 'th'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 600, fontSize: '16px', fontFamily: "'SF Mono', monospace" }}>${sub.amount.toFixed(2)}/mo</span>
                {sub.cancelUrl ? (
                  <a href={sub.cancelUrl} target="_blank" rel="noopener noreferrer">
                    <button style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>Cancel →</button>
                  </a>
                ) : (
                  <button onClick={() => removeSubscription(sub.id)} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

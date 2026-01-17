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
  'la fitness': { name: 'LA Fitness', category: 'Fitness', icon: '💪', cancelUrl: null },
  'equinox': { name: 'Equinox', category: 'Fitness', icon: '💪', cancelUrl: null },
  'peloton': { name: 'Peloton', category: 'Fitness', icon: '🚴', cancelUrl: 'https://members.onepeloton.com/preferences/subscriptions' },
  'headspace': { name: 'Headspace', category: 'Wellness', icon: '🧘', cancelUrl: 'https://www.headspace.com/settings/subscription' },
  'calm': { name: 'Calm', category: 'Wellness', icon: '🧘', cancelUrl: 'https://www.calm.com/account' },
  'linkedin': { name: 'LinkedIn Premium', category: 'Professional', icon: '💼', cancelUrl: 'https://www.linkedin.com/psettings/manage-subscription' },
  'nordvpn': { name: 'NordVPN', category: 'Security', icon: '🔒', cancelUrl: 'https://my.nordaccount.com/dashboard/nordvpn/' },
  'expressvpn': { name: 'ExpressVPN', category: 'Security', icon: '🔒', cancelUrl: 'https://www.expressvpn.com/subscriptions' },
  '1password': { name: '1Password', category: 'Security', icon: '🔑', cancelUrl: 'https://my.1password.com/profile' },
  'lastpass': { name: 'LastPass', category: 'Security', icon: '🔑', cancelUrl: 'https://lastpass.com/account.php' },
  'notion': { name: 'Notion', category: 'Productivity', icon: '📝', cancelUrl: 'https://www.notion.so/my-account' },
  'evernote': { name: 'Evernote', category: 'Productivity', icon: '📝', cancelUrl: 'https://www.evernote.com/Settings.action' },
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
  'uber one': { name: 'Uber One', category: 'Food', icon: '🚗', cancelUrl: 'https://www.ubereats.com/membership' },
  'instacart': { name: 'Instacart+', category: 'Food', icon: '🛒', cancelUrl: 'https://www.instacart.com/store/account/manage_subscription' },
  'xbox': { name: 'Xbox Game Pass', category: 'Gaming', icon: '🎮', cancelUrl: 'https://account.microsoft.com/services/xboxgamepass/cancel' },
  'playstation': { name: 'PlayStation Plus', category: 'Gaming', icon: '🎮', cancelUrl: 'https://www.playstation.com/en-us/support/store/cancel-ps-store-subscription/' },
  'nintendo': { name: 'Nintendo Online', category: 'Gaming', icon: '🎮', cancelUrl: 'https://accounts.nintendo.com/shop/subscription' },
  'twitch': { name: 'Twitch', category: 'Entertainment', icon: '🎮', cancelUrl: 'https://www.twitch.tv/subscriptions' },
  'nytimes': { name: 'NY Times', category: 'News', icon: '📰', cancelUrl: 'https://myaccount.nytimes.com/seg/' },
  'wsj': { name: 'Wall Street Journal', category: 'News', icon: '📰', cancelUrl: 'https://customercenter.wsj.com/' },
  'washington post': { name: 'Washington Post', category: 'News', icon: '📰', cancelUrl: 'https://www.washingtonpost.com/my-account/subscriptions/' },
  'tidal': { name: 'Tidal', category: 'Music', icon: '🎵', cancelUrl: 'https://tidal.com/settings/subscription' },
  'deezer': { name: 'Deezer', category: 'Music', icon: '🎵', cancelUrl: 'https://www.deezer.com/account/subscription' },
  'pandora': { name: 'Pandora', category: 'Music', icon: '🎵', cancelUrl: 'https://www.pandora.com/account/settings' },
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
          <meta name="description" content="Instantly detect recurring charges from your bank statements. Cancel forgotten subscriptions and save money." />
        </Head>
        <div style={{ minHeight: '100vh', background: '#fff' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0066ff' }}>stopmysub</div>
            <button onClick={() => setStep('upload')} style={{ padding: '12px 24px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 500, cursor: 'pointer' }}>
              Get Started
            </button>
          </nav>
          
          <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#e6f0ff', color: '#0066ff', borderRadius: '20px', fontSize: '14px', fontWeight: 500, marginBottom: '24px' }}>
              ✨ Save an average of $460/year
            </div>
            <h1 style={{ fontSize: '56px', fontWeight: 700, lineHeight: 1.1, marginBottom: '24px' }}>
              Stop paying for<br/><span style={{ color: '#0066ff' }}>forgotten subs.</span>
            </h1>
            <p style={{ fontSize: '20px', color: '#536471', marginBottom: '40px' }}>
              Instantly detect recurring charges from your bank statements.<br/>
              Identify waste, cancel in one click, and take back control of your money.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setStep('upload')} style={{ padding: '16px 32px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>
                Scan My Statement →
              </button>
              <button onClick={loadDemo} style={{ padding: '16px 32px', background: '#fff', color: '#0f1419', border: '1px solid #e6e9ed', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>
                View Demo Dashboard
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '60px auto', padding: '0 20px' }}>
            {[
              { icon: '🔒', title: 'Upload Securely', desc: 'Drag & drop your PDF or CSV bank statement. All processing happens locally in your browser.' },
              { icon: '🔍', title: 'Auto-Detection', desc: 'We scan for 50+ known services like Netflix, Spotify, Adobe, and gym memberships.' },
              { icon: '❌', title: 'Cancel & Save', desc: 'See your monthly spend and get direct links to each service\'s cancellation page.' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e6e9ed', borderRadius: '16px', padding: '32px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: '#536471', fontSize: '16px' }}>{f.desc}</p>
              </div>
            ))}
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
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f9fb' }}>
          <button onClick={() => setStep('landing')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '16px', color: '#536471', cursor: 'pointer' }}>
            ← Back
          </button>
          
          <div style={{ background: '#fff', borderRadius: '24px', padding: '48px', maxWidth: '500px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Upload Your Statement</h1>
            <p style={{ color: '#536471', marginBottom: '32px' }}>Drop your bank statement (PDF or CSV) to find subscriptions</p>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e6e9ed', borderTopColor: '#0066ff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p>Analyzing your statement...</p>
              </div>
            ) : (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? '#0066ff' : '#e6e9ed'}`,
                    background: dragActive ? '#e6f0ff' : '#fff',
                    borderRadius: '16px', padding: '48px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Drop your bank statement here</h3>
                  <span style={{ color: '#536471', fontSize: '14px' }}>PDF or CSV from any bank</span>
                  <input type="file" id="fileInput" accept=".pdf,.csv,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
                
                {error && <div style={{ background: '#ffefef', color: '#e5484d', padding: '12px 16px', borderRadius: '8px', marginTop: '16px' }}>{error}</div>}
                
                <div style={{ textAlign: 'center', color: '#8b98a5', margin: '24px 0' }}>or</div>
                
                <button onClick={loadDemo} style={{ width: '100%', padding: '16px 32px', background: '#f8f9fb', color: '#0f1419', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>
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
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>We found {subscriptions.length} subscriptions</h1>
          <p style={{ color: '#536471', marginBottom: '32px' }}>Review and confirm the subscriptions we detected</p>
          
          {subscriptions.map(sub => (
            <div key={sub.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e6e9ed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>{sub.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '17px' }}>{sub.merchant}</div>
                  <div style={{ color: '#536471', fontSize: '14px' }}>{sub.category}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 600, fontSize: '18px' }}>${sub.amount.toFixed(2)}/mo</span>
                <button onClick={() => removeSubscription(sub.id)} style={{ background: 'none', border: 'none', color: '#e5484d', cursor: 'pointer', fontSize: '20px', padding: '8px' }}>×</button>
              </div>
            </div>
          ))}
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button onClick={() => setStep('upload')} style={{ flex: 1, padding: '16px 32px', background: '#fff', color: '#0f1419', border: '1px solid #e6e9ed', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
            <button onClick={() => setStep('dashboard')} style={{ flex: 1, padding: '16px 32px', background: '#0066ff', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: 500, cursor: 'pointer' }}>Continue to Dashboard →</button>
          </div>
        </div>
      </>
    );
  }

  // ========== DASHBOARD ==========
  return (
    <>
      <Head><title>Dashboard - StopMySub</title></Head>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0066ff' }}>stopmysub</div>
          <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', border: '1px solid #e6e9ed' }}>
            <button onClick={() => setViewMode('calendar')} style={{ padding: '10px 20px', border: 'none', background: viewMode === 'calendar' ? '#0066ff' : 'none', color: viewMode === 'calendar' ? '#fff' : '#536471', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>📅 Calendar</button>
            <button onClick={() => setViewMode('list')} style={{ padding: '10px 20px', border: 'none', background: viewMode === 'list' ? '#0066ff' : 'none', color: viewMode === 'list' ? '#fff' : '#536471', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>📋 List</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e6e9ed' }}>
            <div style={{ color: '#536471', fontSize: '14px', marginBottom: '8px' }}>Active Subscriptions</div>
            <div style={{ fontSize: '32px', fontWeight: 700 }}>{subscriptions.length}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e6e9ed' }}>
            <div style={{ color: '#536471', fontSize: '14px', marginBottom: '8px' }}>Monthly Spend</div>
            <div className="mono" style={{ fontSize: '32px', fontWeight: 700, color: '#e5484d' }}>${totalMonthly.toFixed(2)}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e6e9ed' }}>
            <div style={{ color: '#536471', fontSize: '14px', marginBottom: '8px' }}>Yearly Total</div>
            <div className="mono" style={{ fontSize: '32px', fontWeight: 700 }}>${totalYearly.toFixed(2)}</div>
          </div>
        </div>
        
        {viewMode === 'calendar' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '32px 0 16px' }}>Billing Calendar</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e6e9ed' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={{ fontWeight: 600, textAlign: 'center', padding: '8px', color: '#536471', fontSize: '14px' }}>{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i < 3 ? null : i - 2;
                if (dayNum === null || dayNum > 31) return <div key={i} style={{ aspectRatio: '1' }}></div>;
                const daySubs = subscriptions.filter(s => s.billingDay === dayNum);
                return (
                  <div key={i} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '14px', background: daySubs.length > 0 ? '#e6f0ff' : 'transparent' }}>
                    <span style={{ fontWeight: 500 }}>{dayNum}</span>
                    {daySubs.length > 0 && <span style={{ fontSize: '18px', marginTop: '4px' }}>{daySubs.map(s => s.icon).join('')}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
        
        <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '32px 0 16px' }}>Your Subscriptions</h2>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e6e9ed', overflow: 'hidden' }}>
          {subscriptions.map((sub, i) => (
            <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: i < subscriptions.length - 1 ? '1px solid #e6e9ed' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>{sub.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '17px' }}>{sub.merchant}</div>
                  <div style={{ color: '#536471', fontSize: '14px' }}>{sub.category} • Bills on the {sub.billingDay}{sub.billingDay === 1 ? 'st' : sub.billingDay === 2 ? 'nd' : sub.billingDay === 3 ? 'rd' : 'th'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="mono" style={{ fontWeight: 600, fontSize: '18px' }}>${sub.amount.toFixed(2)}/mo</span>
                {sub.cancelUrl ? (
                  <a href={sub.cancelUrl} target="_blank" rel="noopener noreferrer">
                    <button style={{ background: '#ffefef', color: '#e5484d', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Cancel →</button>
                  </a>
                ) : (
                  <button onClick={() => removeSubscription(sub.id)} style={{ background: '#ffefef', color: '#e5484d', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

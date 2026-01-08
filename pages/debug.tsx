import { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfParser';

export default function Debug() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        console.log('Processing file:', file.name);
        const extracted = await extractTextFromPDF(file);
        console.log('Full extracted text:', extracted);
        setText(extracted);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
      }
    }
  };

  return (
    <div style={{ padding: 40, background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <h1>PDF Debug</h1>
      <input type="file" accept=".pdf" onChange={handleFile} style={{ marginBottom: 20 }} />
      {error && <div style={{ color: 'red', marginTop: 20 }}>Error: {error}</div>}
      {text && (
        <div style={{ marginTop: 20 }}>
          <h3>Extracted Text ({text.length} characters):</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            background: '#111', 
            padding: 20, 
            borderRadius: 8,
            maxHeight: 600, 
            overflow: 'auto',
            fontSize: 12,
            lineHeight: 1.5
          }}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { extractTextFromPDF } from '../utils/pdfParser';

export default function Test() {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const extracted = await extractTextFromPDF(file);
        setText(extracted);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div style={{ padding: 40, background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>PDF Debug Test</h1>
      <input type="file" accept=".pdf" onChange={handleFile} />
      {error && <div style={{ color: 'red', marginTop: 20 }}>Error: {error}</div>}
      {text && (
        <div style={{ marginTop: 20 }}>
          <h3>Extracted Text:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#222', padding: 20, maxHeight: 500, overflow: 'auto' }}>
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}

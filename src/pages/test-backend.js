import { useState, useEffect } from 'react';

export default function TestBackend() {
  const [result, setResult] = useState('Probando...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('URL usada:', process.env.NEXT_PUBLIC_API_URL);
        
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL.replace('/api', '') + '/health'
        );
        
        if (response.ok) {
          const data = await response.json();
          setResult(`✅ CONEXIÓN EXITOSA: ${JSON.stringify(data)}`);
        } else {
          setResult(`❌ Error HTTP: ${response.status}`);
        }
      } catch (error) {
        setResult(`❌ ERROR: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Prueba de Conexión Backend</h1>
      <p><strong>URL del backend:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
      <p><strong>Resultado:</strong> {result}</p>
    </div>
  );
}
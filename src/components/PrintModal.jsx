import React, { useState } from 'react';
import { printZpl } from '../utils/zebraBrowserPrint';
import { processMultiColumnZpl, shiftZplX } from '../utils/zplProcessor';
import { sendCloudPrintJob, subscribeToJobStatus } from '../utils/firestore';
import { useAuth } from '../contexts/AuthContext';

const PrintModal = ({ config, activePrinter, isHost, onClose }) => {
  const { currentUser } = useAuth();
  const [zplCode, setZplCode] = useState('');
  const [status, setStatus] = useState(null);

  const handlePrint = async () => {
    if (!zplCode.trim()) {
      setStatus({ type: 'error', message: 'Cole o código ZPL antes de imprimir.' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Processando ZPL...' });
      
      let finalZpl = zplCode;
      const numColumns = parseInt(config.columns, 10) || 1;
      const labelWidthCm = parseFloat(config.width) || 0;
      const gapCm = parseFloat(config.gap) || 0;
      
      const labelWidthDots = Math.round(labelWidthCm * 80);
      const gapDots = Math.round(gapCm * 80);

      if (numColumns > 1) {
        finalZpl = processMultiColumnZpl(zplCode, numColumns, labelWidthDots, gapDots);
      }

      const offsetX = parseInt(config.offsetX, 10) || 0;
      if (offsetX !== 0) {
        finalZpl = shiftZplX(finalZpl, offsetX);
      }

      if (isHost) {
        if (!activePrinter) {
          throw new Error('Nenhuma impressora ativa selecionada no Computador Host.');
        }
        await printZpl(finalZpl, activePrinter);
        setStatus({ type: 'success', message: 'Etiqueta impressa com sucesso!' });
        setZplCode('');
        setTimeout(() => onClose(), 2000);
      } else {
        setStatus({ type: 'info', message: 'Enviando comando para o Computador Host na nuvem...' });
        const jobId = await sendCloudPrintJob(currentUser.uid, config.name, finalZpl);
        
        const unsubscribe = subscribeToJobStatus(currentUser.uid, jobId, (jobData) => {
          if (jobData.status === 'completed') {
            setStatus({ type: 'success', message: 'O Host imprimiu sua etiqueta com sucesso!' });
            setZplCode('');
            unsubscribe();
            setTimeout(() => onClose(), 2500);
          } else if (jobData.status === 'error') {
            setStatus({ type: 'error', message: `Erro no Host: ${jobData.error}` });
            unsubscribe();
          } else if (jobData.status === 'printing') {
            setStatus({ type: 'info', message: 'O Host recebeu e está imprimindo agora...' });
          }
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Erro: ${err.message}` });
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Imprimir: {config.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
        </div>

        {!isHost && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--primary-color)' }}>
            <strong>Modo Remoto:</strong> Ao clicar em imprimir, o código será enviado pela nuvem para o computador principal.
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cole o Código ZPL Aqui:</label>
          <textarea
            value={zplCode}
            onChange={(e) => setZplCode(e.target.value)}
            style={{ width: '100%', height: '200px', padding: '1rem', fontFamily: 'monospace', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', resize: 'vertical' }}
            placeholder="^XA...^XZ"
          />
        </div>

        {status && (
          <div style={{
            padding: '1rem', marginBottom: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 500,
            backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: status.type === 'success' ? 'var(--success-color)' : status.type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)',
            border: `1px solid ${status.type === 'success' ? 'var(--success-color)' : status.type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'}`
          }}>
            {status.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={status && status.type === 'info'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;

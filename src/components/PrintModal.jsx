import React, { useState } from 'react';
import { printZpl } from '../utils/zebraBrowserPrint';
import { shiftZplX } from '../utils/zplProcessor';

const PrintModal = ({ config, activePrinter, onClose }) => {
  const [zplCode, setZplCode] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!zplCode.trim()) {
      setStatus({ type: 'error', message: 'Cole o código ZPL antes de imprimir.' });
      return;
    }

    if (!activePrinter) {
      setStatus({ type: 'error', message: 'Nenhuma impressora Zebra selecionada. Verifique a conexão do Zebra Browser Print.' });
      return;
    }

    setIsPrinting(true);
    setStatus({ type: 'info', message: `Enviando para ${activePrinter.name}...` });

    try {
      let finalZpl = zplCode;
      
      // Injeta Print Width (^PW) se o usuário definiu a largura em cm
      if (config.width && config.width > 0) {
        const widthInDots = Math.round(config.width * 80);
        // Garante que o ^PW seja injetado logo após o ^XA
        finalZpl = finalZpl.replace(/\^XA/gi, `^XA\n^PW${widthInDots}`);
      }
      
      // Aplica o ajuste horizontal (empurrar para a direita/esquerda)
      if (config.offsetX && config.offsetX !== 0) {
        finalZpl = shiftZplX(finalZpl, config.offsetX);
      }

      await printZpl(finalZpl, activePrinter);
      
      setStatus({ type: 'success', message: 'Etiqueta enviada com sucesso!' });
      setZplCode('');
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2rem', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Imprimir - <span style={{ color: 'var(--primary-color)' }}>{config.name}</span></h2>
            {activePrinter ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Destino: {activePrinter.name}</span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--danger-color)' }}>Destino: Impressora Offline</span>
            )}
            
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              {config.width > 0 && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--surface-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  {config.width}cm {config.height ? `x ${config.height}cm` : ''}
                </span>
              )}
              {config.offsetX !== 0 && config.offsetX !== undefined && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'var(--surface-color)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  Ajuste X: {config.offsetX}pt
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Cole o Código ZPL aqui:</label>
          <textarea 
            value={zplCode}
            onChange={(e) => setZplCode(e.target.value)}
            placeholder="^XA...^XZ"
            style={{ width: '100%', height: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.9rem' }}
          />
        </div>

        {status.message && (
          <div style={{ 
            padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--border-radius-sm)',
            backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: status.type === 'error' ? 'var(--danger-color)' : status.type === 'success' ? 'var(--success-color)' : 'var(--primary-color)',
            border: `1px solid ${status.type === 'error' ? 'var(--danger-color)' : status.type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'}`
          }}>
            {status.message}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isPrinting}>Cancelar</button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={isPrinting || !zplCode.trim() || !activePrinter}>
            {isPrinting ? 'Enviando...' : 'Imprimir Etiquetas'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;

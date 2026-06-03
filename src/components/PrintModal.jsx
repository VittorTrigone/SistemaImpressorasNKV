import React, { useState } from 'react';
import { printZpl } from '../utils/zebraBrowserPrint';
import { shiftZplX, injectDimensions, injectQuantity } from '../utils/zplProcessor';
import { sendCloudPrintJob, subscribeToJobStatus } from '../utils/firestore';
import { useAuth } from '../contexts/AuthContext';
import { fileToCanvas, canvasToZpl, textToCanvas } from '../utils/imageToZpl';

const PrintModal = ({ config, activePrinter, isHost, onClose }) => {
  const { currentUser } = useAuth();
  const [zplCode, setZplCode] = useState('');
  const [status, setStatus] = useState(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [textToPrint, setTextToPrint] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsProcessingFile(true);
      setStatus({ type: 'info', message: 'Extraindo, cortando e convertendo...' });
      
      const canvas = await fileToCanvas(
        file, 
        isPortrait, 
        parseFloat(config.width) || 10, 
        parseFloat(config.height) || 15
      );
      const generatedZpl = canvasToZpl(canvas);
      
      setZplCode(generatedZpl);
      setStatus({ type: 'success', message: 'Arquivo convertido com sucesso!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Erro ao converter o arquivo: ${err.message}` });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleTextConversion = async () => {
    if (!textToPrint.trim()) return;

    try {
      setIsProcessingFile(true);
      setStatus({ type: 'info', message: 'Gerando imagem do texto...' });

      const canvas = await textToCanvas(
        textToPrint,
        isPortrait,
        parseFloat(config.width) || 10, 
        parseFloat(config.height) || 15
      );
      const generatedZpl = canvasToZpl(canvas);
      
      setZplCode(generatedZpl);
      setStatus({ type: 'success', message: 'Texto convertido com sucesso!' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Erro ao converter texto: ${err.message}` });
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handlePrint = async () => {
    if (!zplCode.trim()) {
      setStatus({ type: 'error', message: 'Cole o código ZPL antes de imprimir.' });
      return;
    }

    try {
      setStatus({ type: 'info', message: 'Processando ZPL...' });
      
      let finalZpl = zplCode;
      const labelWidthCm = parseFloat(config.width) || 0;
      const labelHeightCm = parseFloat(config.height) || 0;

      // Injeta os comandos ^PW e ^LL
      finalZpl = injectDimensions(finalZpl, labelWidthCm, labelHeightCm);

      const offsetX = parseInt(config.offsetX, 10) || 0;
      if (offsetX !== 0) {
        finalZpl = shiftZplX(finalZpl, offsetX);
      }
      
      // Injeta a quantidade ^PQ
      finalZpl = injectQuantity(finalZpl, parseInt(quantity, 10));

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
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in print-modal-content">
        <div className="modal-header">
          <h2>Imprimir: <span className="highlight-text">{config.name}</span></h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {!isHost && (
          <div className="alert-box info-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span><strong>Modo Remoto:</strong> O ZPL será enviado pela nuvem para o servidor Zebra.</span>
          </div>
        )}

        {/* Gerador de Arquivo e Texto */}
        <div className="generator-grid">
          
          <div className="generator-full-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={isPortrait} 
                onChange={(e) => setIsPortrait(e.target.checked)} 
                className="custom-checkbox"
              />
              <span>Modo Retrato (Rotacionar Imagens/Textos em 90°)</span>
            </label>
          </div>

          <div className="generator-col">
            <label className="input-label">Converter PDF/Imagem:</label>
            <input 
              type="file" 
              accept=".pdf, image/png, image/jpeg" 
              onChange={handleFileUpload} 
              disabled={isProcessingFile}
              className="file-input"
            />
          </div>

          <div className="generator-col">
            <label className="input-label">Ou Gerar Etiqueta de Texto:</label>
            <div className="input-with-button">
              <input 
                type="text" 
                value={textToPrint}
                onChange={(e) => setTextToPrint(e.target.value)}
                placeholder="Ex: CUIDADO FRÁGIL"
                className="text-input"
              />
              <button 
                type="button"
                className="btn btn-secondary small-btn" 
                onClick={handleTextConversion}
                disabled={isProcessingFile || !textToPrint}
              >
                Gerar
              </button>
            </div>
          </div>
        </div>

        <div className="zpl-section">
          <div className="zpl-header">
            <label>Código ZPL Bruto:</label>
            <div className="quantity-control">
              <label>Cópias:</label>
              <input 
                type="number" 
                min="1" 
                max="999" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                className="quantity-input"
              />
            </div>
          </div>
          <textarea 
            className="zpl-textarea code-font"
            value={zplCode}
            onChange={(e) => setZplCode(e.target.value)}
            placeholder="^XA...^XZ"
            spellCheck="false"
          />
        </div>

        {status && (
          <div className={`alert-box ${status.type === 'error' ? 'error-alert' : status.type === 'success' ? 'success-alert' : 'info-alert'}`}>
            {status.message}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={isProcessingFile || status?.type === 'info'}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            disabled={!zplCode.trim() || isProcessingFile || status?.type === 'info'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir ({quantity} {quantity > 1 ? 'cópias' : 'cópia'})
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintModal;

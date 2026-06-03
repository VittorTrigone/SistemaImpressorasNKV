import { useState, useEffect } from 'react';
import './index.css';

import PrinterCard from './components/PrinterCard';
import PrintModal from './components/PrintModal';
import ConfigForm from './components/ConfigForm';
import { getAvailablePrinters, getDefaultPrinter } from './utils/zebraBrowserPrint';

function App() {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  
  // Printer detection state
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [activePrinterUid, setActivePrinterUid] = useState('');
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);

  // Load configs from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem('zebra_configs');
    if (saved) {
      setConfigs(JSON.parse(saved));
    } else {
      // Default sample config
      const initialConfigs = [
        { id: '1', name: 'Meli Produtos', width: '8', height: '4' },
        { id: '2', name: 'Volume Padrão', width: '', height: '' }
      ];
      setConfigs(initialConfigs);
      localStorage.setItem('zebra_configs', JSON.stringify(initialConfigs));
    }

    // Also load saved printer choice if any
    const savedPrinterUid = localStorage.getItem('zebra_active_printer_uid');
    if (savedPrinterUid) {
      setActivePrinterUid(savedPrinterUid);
    }

    findPrinters();
  }, []);

  const findPrinters = async () => {
    setIsSearchingPrinters(true);
    try {
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);
      
      // se não houver impressora selecionada mas houver impressoras disponíveis, tentar a default
      if (!activePrinterUid && printers.length > 0) {
        try {
          const defaultP = await getDefaultPrinter();
          if (defaultP && defaultP.uid) {
            handlePrinterChange(defaultP.uid);
          } else {
            handlePrinterChange(printers[0].uid);
          }
        } catch {
          handlePrinterChange(printers[0].uid);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingPrinters(false);
    }
  };

  const handlePrinterChange = (uid) => {
    setActivePrinterUid(uid);
    localStorage.setItem('zebra_active_printer_uid', uid);
  };

  const saveConfigs = (newConfigs) => {
    setConfigs(newConfigs);
    localStorage.setItem('zebra_configs', JSON.stringify(newConfigs));
  };

  const handleSaveConfig = (configData) => {
    let newConfigs;
    if (editingConfig) {
      newConfigs = configs.map(c => c.id === configData.id ? configData : c);
    } else {
      newConfigs = [...configs, configData];
    }
    saveConfigs(newConfigs);
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDeleteConfig = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      saveConfigs(configs.filter(c => c.id !== id));
    }
  };

  const openNewForm = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  // Encontra o objeto da impressora ativa
  const activePrinterObj = availablePrinters.find(p => p.uid === activePrinterUid);

  return (
    <div className="layout-container animate-fade-in">
      <header className="header">
        <h1>Zebra Print Manager</h1>
        <p>Selecione uma configuração, cole seu ZPL e imprima num piscar de olhos.</p>
        
        {/* Componente de Seleção de Impressora */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <div className="glass-panel" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', gap: '0.75rem', borderRadius: '50px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Impressora Ativa:</span>
            
            {isSearchingPrinters ? (
              <span style={{ fontSize: '0.9rem', color: 'var(--warning-color)' }}>Buscando...</span>
            ) : availablePrinters.length > 0 ? (
              <select 
                value={activePrinterUid} 
                onChange={(e) => handlePrinterChange(e.target.value)}
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--primary-color)', 
                  fontWeight: 600, outline: 'none', cursor: 'pointer', padding: 0 
                }}
              >
                {availablePrinters.map(p => (
                  <option key={p.uid} value={p.uid} style={{ color: '#000' }}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.9rem', color: 'var(--danger-color)' }}>Nenhuma Zebra detectada</span>
            )}
            
            <button onClick={findPrinters} style={{ color: 'var(--text-secondary)' }} title="Recarregar impressoras">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Minhas Configurações</h2>
          <button 
            className="btn btn-primary" 
            onClick={openNewForm}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nova Configuração
          </button>
        </div>

        {showForm && (
          <ConfigForm 
            initialData={editingConfig}
            onSave={handleSaveConfig} 
            onCancel={() => { setShowForm(false); setEditingConfig(null); }} 
          />
        )}

        {configs.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhuma configuração salva. Crie uma para começar!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {configs.map(config => (
              <PrinterCard 
                key={config.id} 
                config={config} 
                onClick={(cfg) => setSelectedConfig(cfg)}
                onEdit={handleEditConfig}
                onDelete={handleDeleteConfig}
              />
            ))}
          </div>
        )}
      </main>

      {selectedConfig && (
        <PrintModal 
          config={selectedConfig} 
          activePrinter={activePrinterObj}
          onClose={() => setSelectedConfig(null)} 
        />
      )}
    </div>
  )
}

export default App

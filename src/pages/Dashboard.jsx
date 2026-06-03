import { useState, useEffect } from 'react';
import '../index.css';

import PrinterCard from '../components/PrinterCard';
import PrintModal from '../components/PrintModal';
import ConfigForm from '../components/ConfigForm';
import { getAvailablePrinters, getDefaultPrinter, printZpl } from '../utils/zebraBrowserPrint';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToConfigs, saveConfigsToCloud, listenToPendingJobs, updateJobStatus } from '../utils/firestore';

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  
  // Printer detection state
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [activePrinterUid, setActivePrinterUid] = useState('');
  const [isSearchingPrinters, setIsSearchingPrinters] = useState(false);

  // Relay State
  const [isHost, setIsHost] = useState(false);

  // Load configs from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToConfigs(currentUser.uid, (cloudConfigs) => {
      setConfigs(cloudConfigs);
    });
    return unsubscribe;
  }, [currentUser]);

  // Printer logic
  useEffect(() => {
    if (!currentUser) return;
    const savedPrinterUid = localStorage.getItem(`zebra_active_printer_uid_${currentUser.uid}`);
    if (savedPrinterUid) {
      setActivePrinterUid(savedPrinterUid);
    }
    setIsHost(localStorage.getItem(`zebra_is_host_${currentUser.uid}`) === 'true');
    findPrinters();
  }, [currentUser]);

  const findPrinters = async () => {
    setIsSearchingPrinters(true);
    try {
      const printers = await getAvailablePrinters();
      setAvailablePrinters(printers);
      if (!activePrinterUid && printers.length > 0) {
        try {
          const defaultP = await getDefaultPrinter();
          if (defaultP && defaultP.uid) handlePrinterChange(defaultP.uid);
          else handlePrinterChange(printers[0].uid);
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
    if (currentUser) localStorage.setItem(`zebra_active_printer_uid_${currentUser.uid}`, uid);
  };

  const handleToggleHost = () => {
    const newVal = !isHost;
    setIsHost(newVal);
    if (currentUser) localStorage.setItem(`zebra_is_host_${currentUser.uid}`, newVal);
  };

  const activePrinterObj = availablePrinters.find(p => p.uid === activePrinterUid);

  // Lógica do Servidor de Impressão (Host)
  useEffect(() => {
    if (!currentUser || !isHost || !activePrinterObj) return;

    const unsubscribe = listenToPendingJobs(currentUser.uid, async (jobs) => {
      for (const job of jobs) {
        try {
          await updateJobStatus(currentUser.uid, job.id, 'printing');
          await printZpl(job.zplCode, activePrinterObj);
          await updateJobStatus(currentUser.uid, job.id, 'completed');
        } catch (err) {
          await updateJobStatus(currentUser.uid, job.id, 'error', err.message);
        }
      }
    });

    return unsubscribe;
  }, [currentUser, isHost, activePrinterObj]);

  const handleSaveConfig = async (configData) => {
    let newConfigs;
    if (editingConfig) {
      newConfigs = configs.map(c => c.id === configData.id ? configData : c);
    } else {
      newConfigs = [...configs, configData];
    }
    await saveConfigsToCloud(currentUser.uid, newConfigs);
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDeleteConfig = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
      const newConfigs = configs.filter(c => c.id !== id);
      await saveConfigsToCloud(currentUser.uid, newConfigs);
    }
  };

  const openNewForm = () => {
    setEditingConfig(null);
    setShowForm(true);
  };

  return (
    <div className="layout-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{currentUser?.email}</span>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Sair</button>
        </div>
      </div>
      <header className="header" style={{ marginBottom: '1.5rem' }}>
        <h1>Zebra Print <span style={{ color: 'var(--primary-color)' }}>Cloud</span></h1>
        <p>Selecione uma configuração, cole seu ZPL e imprima num piscar de olhos.</p>
        
        {/* Componente de Seleção de Impressora */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', gap: '0.75rem', borderRadius: '50px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sua Impressora Local:</span>
            
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
            
            <button onClick={findPrinters} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }} title="Recarregar impressoras">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>

          <label className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', gap: '0.75rem', borderRadius: '50px', cursor: 'pointer', border: isHost ? '1px solid var(--primary-color)' : '' }}>
            <input 
              type="checkbox" 
              checked={isHost} 
              onChange={handleToggleHost} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isHost ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
              {isHost ? 'Atuando como Servidor de Impressão' : 'Tornar este PC o Servidor'}
            </span>
          </label>
        </div>
      </header>
      
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Minhas Configurações</h2>
          <button className="btn btn-primary" onClick={openNewForm}>
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
            Nenhuma configuração salva na nuvem. Crie uma para começar!
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
          isHost={isHost}
          onClose={() => setSelectedConfig(null)} 
        />
      )}
    </div>
  )
}

export default Dashboard;

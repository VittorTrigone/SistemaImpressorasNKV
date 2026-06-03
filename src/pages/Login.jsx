import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      let msg = 'Erro ao fazer login.';
      if (err.code === 'auth/invalid-credential') msg = 'E-mail ou senha incorretos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-primary)', letterSpacing: '-1px' }}>Zebra Print <span style={{ color: 'var(--primary-color)' }}>Cloud</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.75rem' }}>Acesse seu painel de controle</p>
        </div>
        
        {error && (
          <div className="alert-box error-alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="input-label">E-mail Corporativo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%' }} placeholder="seu@email.com" />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label className="input-label">Senha de Acesso</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} placeholder="••••••••" />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 600 }}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Ainda não tem conta? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Cadastre-se grátis</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

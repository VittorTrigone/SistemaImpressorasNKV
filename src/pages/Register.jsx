import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    try {
      setError('');
      setLoading(true);
      await register(email, password);
      navigate('/');
    } catch (err) {
      let msg = 'Erro ao criar conta.';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está cadastrado.';
      else if (err.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'ATENÇÃO: Você esqueceu de ativar o login por "E-mail/senha" lá no painel do Firebase (seção Autenticação).';
      else msg = `Erro ao criar conta: ${err.message} (${err.code})`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Criar Conta</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Junte-se ao Zebra Print Cloud</p>
        </div>
        
        {error && (
          <div style={{ 
            padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '4px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)',
            border: '1px solid var(--danger-color)', textAlign: 'center', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%' }} placeholder="seu@email.com" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%' }} placeholder="Mínimo 6 caracteres" minLength="6" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Confirmar Senha</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%' }} placeholder="Digite a senha novamente" minLength="6" />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Já tem uma conta? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Faça Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

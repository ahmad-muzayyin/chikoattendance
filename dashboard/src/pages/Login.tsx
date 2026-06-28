import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      login(token, user);
      navigate('/');
    } catch (err: any) {
      if (err.message === 'Unauthorized role') {
         setError('Akses ditolak. Anda tidak memiliki izin Admin.');
      } else {
         setError(err.response?.data?.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Chiko<span style={{ color: 'var(--primary-color)' }}>Admin</span></h1>
          <p style={styles.subtitle}>Silakan masuk untuk melanjutkan</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chiko.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-color)',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--surface-color)',
    padding: '2.5rem',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger-color)',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius)',
    fontSize: '0.875rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  submitBtn: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.75rem',
  },
};

export default Login;

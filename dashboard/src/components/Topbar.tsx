import React from 'react';
import { Bell, Search } from 'lucide-react';

const Topbar = () => {
  return (
    <header style={styles.topbar}>
      <div style={styles.searchContainer}>
        <Search size={18} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Cari sesuatu..." 
          style={styles.searchInput}
        />
      </div>
      <div style={styles.actions}>
        <button style={styles.iconBtn}>
          <Bell size={20} />
          <span style={styles.badge}></span>
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    height: '70px',
    backgroundColor: 'var(--bg-color)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'var(--surface-color)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--border-radius)',
    width: '300px',
    border: '1px solid var(--border-color)',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    outline: 'none',
    width: '100%',
    fontSize: '0.875rem',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  iconBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'var(--transition)',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '6px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--primary-color)',
    borderRadius: '50%',
  }
};

export default Topbar;

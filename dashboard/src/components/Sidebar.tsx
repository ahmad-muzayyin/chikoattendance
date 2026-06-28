import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Settings, LogOut, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Karyawan', path: '/users', icon: <Users size={20} /> },
    { name: 'Outlet', path: '/branches', icon: <MapPin size={20} /> },
    { name: 'Absensi', path: '/attendance', icon: <CalendarDays size={20} /> },
    { name: 'Pengaturan', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <h2 style={styles.logoText}>Chiko<span style={{ color: 'var(--primary-color)' }}>Admin</span></h2>
      </div>

      <div style={styles.userInfo}>
        <div style={styles.avatar}>{user?.name?.charAt(0) || 'A'}</div>
        <div>
          <div style={styles.userName}>{user?.name || 'Admin'}</div>
          <div style={styles.userRole}>{user?.role || 'Administrator'}</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--surface-color)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  logoContainer: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  userInfo: {
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    borderBottom: '1px solid var(--border-color)',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '1.25rem',
  },
  userName: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
  nav: {
    flex: 1,
    padding: '1rem 0',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.5rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'var(--transition)',
    borderLeft: '3px solid transparent',
  },
  navItemActive: {
    color: 'var(--primary-color)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftColor: 'var(--primary-color)',
  },
  footer: {
    padding: '1.5rem',
    borderTop: '1px solid var(--border-color)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--danger-color)',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.875rem',
    borderRadius: 'var(--border-radius)',
    transition: 'var(--transition)',
  },
};

export default Sidebar;

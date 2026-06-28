import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Users, Clock, CalendarX2, CheckCircle2 } from 'lucide-react';

interface MonitoringData {
  summary: {
    totalEmployees: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
  };
  details: any[];
}

const DashboardOverview = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonitoring = async () => {
      try {
        const response = await apiClient.get('/admin/monitoring');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch monitoring data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMonitoring();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Memuat data dashboard...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Overview Hari Ini</h1>

      <div style={styles.grid}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid var(--primary-color)' }}>
          <div>
            <div style={styles.statTitle}>Total Karyawan</div>
            <div style={styles.statValue}>{data?.summary?.totalEmployees || 0}</div>
          </div>
          <Users size={32} color="var(--primary-color)" opacity={0.8} />
        </div>

        <div style={{ ...styles.statCard, borderLeft: '4px solid var(--success-color)' }}>
          <div>
            <div style={styles.statTitle}>Hadir Tepat Waktu</div>
            <div style={styles.statValue}>{data?.summary?.present || 0}</div>
          </div>
          <CheckCircle2 size={32} color="var(--success-color)" opacity={0.8} />
        </div>

        <div style={{ ...styles.statCard, borderLeft: '4px solid #F59E0B' }}>
          <div>
            <div style={styles.statTitle}>Terlambat</div>
            <div style={styles.statValue}>{data?.summary?.late || 0}</div>
          </div>
          <Clock size={32} color="#F59E0B" opacity={0.8} />
        </div>

        <div style={{ ...styles.statCard, borderLeft: '4px solid var(--danger-color)' }}>
          <div>
            <div style={styles.statTitle}>Tidak Hadir / Izin</div>
            <div style={styles.statValue}>{(data?.summary?.absent || 0) + (data?.summary?.onLeave || 0)}</div>
          </div>
          <CalendarX2 size={32} color="var(--danger-color)" opacity={0.8} />
        </div>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Aktivitas Terkini</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Data pemantauan aktivitas karyawan hari ini akan muncul di sini.</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  statCard: {
    backgroundColor: 'var(--surface-color)',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius-lg)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  statTitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
  },
  statValue: {
    color: 'var(--text-primary)',
    fontSize: '1.75rem',
    fontWeight: 700,
  }
};

export default DashboardOverview;

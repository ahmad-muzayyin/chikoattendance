import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Edit, Plus, Trash2, X, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  type: string;
  timestamp: string;
  isLate: boolean;
  notes?: string;
  User?: {
    name: string;
    role: string;
  };
}

const Attendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    userId: '',
    type: 'CHECK_IN',
    timestamp: '',
    notes: ''
  });

  useEffect(() => {
    // Fetch employees for dropdown (for manual add)
    const fetchEmps = async () => {
      try {
        const res = await apiClient.get('/admin/employees');
        setEmployees(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchEmps();
  }, []);

  useEffect(() => {
    fetchDailyAttendance();
  }, [selectedDate]);

  const fetchDailyAttendance = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/attendance/daily/${selectedDate}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil data absensi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const openAddModal = () => {
    setModalMode('add');
    const now = new Date();
    // format to datetime-local string (YYYY-MM-DDThh:mm)
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: employees.length > 0 ? employees[0].id : '',
      type: 'CHECK_IN',
      timestamp: localDateTime,
      notes: 'Ditambahkan manual dari dashboard'
    });
    setShowModal(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setModalMode('edit');
    setSelectedRecordId(record.id);
    const dateObj = new Date(record.timestamp);
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: '', // not needed for edit, but keep structure
      type: record.type,
      timestamp: localDateTime,
      notes: record.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus data absen ini?')) {
      try {
        await apiClient.delete(`/admin/attendance/${id}`);
        alert('Absensi dihapus');
        fetchDailyAttendance();
      } catch (e) {
        alert('Gagal menghapus');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        if (!formData.userId) {
          alert('Pilih karyawan terlebih dahulu!');
          return;
        }
        await apiClient.post('/admin/attendance/manual', formData);
        alert('Absensi manual berhasil ditambahkan');
      } else {
        await apiClient.put(`/admin/attendance/${selectedRecordId}`, formData);
        alert('Absensi berhasil diperbarui');
      }
      setShowModal(false);
      fetchDailyAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Pemantauan Absensi Harian</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Manual
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Calendar size={20} style={{ color: 'var(--text-secondary)' }} />
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Pilih Tanggal:</label>
          <input 
            type="date" 
            className="input-field" 
            value={selectedDate} 
            onChange={handleDateChange} 
            style={{ minWidth: '200px' }}
          />
        </div>
      </div>

      <div className="card table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data...</div>
        ) : !Array.isArray(records) || records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            Belum ada riwayat absensi pada tanggal ini.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>Waktu</th>
                <th>Tipe</th>
                <th>Status</th>
                <th>Catatan</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{rec.User?.name || 'Tidak diketahui'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{rec.User?.role || ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {format(new Date(rec.timestamp), 'HH:mm')}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${rec.type === 'CHECK_IN' ? 'badge-primary' : rec.type === 'CHECK_OUT' ? 'badge-danger' : 'badge-success'}`}>
                      {rec.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {rec.isLate && <span className="badge badge-danger">Terlambat</span>}
                    {!rec.isLate && <span className="badge badge-success">Tepat Waktu</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{rec.notes || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => openEditModal(rec)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(rec.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Tambah Absen Manual' : 'Edit Jam Absen'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {modalMode === 'add' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Karyawan</label>
                  <select 
                    required
                    className="input-field" 
                    value={formData.userId} 
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {Array.isArray(employees) && employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Jenis Absen</label>
                <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="CHECK_IN">Masuk (CHECK IN)</option>
                  <option value="CHECK_OUT">Pulang (CHECK OUT)</option>
                  <option value="SICK">Sakit</option>
                  <option value="PERMIT">Izin</option>
                  <option value="ALPHA">Alpha / Bolos</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Waktu & Tanggal</label>
                <input required type="datetime-local" className="input-field" value={formData.timestamp} onChange={(e) => setFormData({...formData, timestamp: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Catatan Khusus</label>
                <textarea className="input-field" rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Contoh: Lupa absen pulang, dikoreksi admin" />
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

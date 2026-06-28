import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { X, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: number;
  type: string;
  timestamp: string;
  isLate: boolean;
  notes?: string;
}

interface UserAttendanceModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserAttendanceModal: React.FC<UserAttendanceModalProps> = ({ userId, userName, isOpen, onClose }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

  // Edit/Add State
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'CHECK_IN',
    timestamp: '',
    notes: '',
    isLate: false
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    }
  }, [isOpen, userId, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const res = await apiClient.get(`/admin/attendance/${userId}?year=${year}&month=${month}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      alert('Gagal mengambil data absensi');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (type = 'CHECK_IN') => {
    setModalMode('add');
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: userId,
      type,
      timestamp: localDateTime,
      notes: 'Ditambahkan manual dari dashboard',
      isLate: false
    });
    setShowEditModal(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setModalMode('edit');
    setSelectedRecordId(record.id);
    const dateObj = new Date(record.timestamp);
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: userId,
      type: record.type,
      timestamp: localDateTime,
      notes: record.notes || '',
      isLate: record.isLate
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus data absen ini?')) {
      try {
        await apiClient.delete(`/admin/attendance/${id}`);
        fetchData();
      } catch (e) {
        alert('Gagal menghapus');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await apiClient.post('/admin/attendance/manual', formData);
      } else {
        await apiClient.put(`/admin/attendance/${selectedRecordId}`, formData);
      }
      setShowEditModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  // Group records by Date
  const groupedData = React.useMemo(() => {
    const map = new Map<string, {
      date: string,
      checkIn?: AttendanceRecord,
      checkOut?: AttendanceRecord,
      other: AttendanceRecord[]
    }>();

    records.forEach(rec => {
      // Use Local time for grouping
      const localDate = new Date(new Date(rec.timestamp).getTime() + (7 * 60 * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];
      
      if (!map.has(dateStr)) {
        map.set(dateStr, { date: dateStr, other: [] });
      }
      
      const day = map.get(dateStr)!;
      if (rec.type === 'CHECK_IN' && !day.checkIn) {
        day.checkIn = rec;
      } else if (rec.type === 'CHECK_OUT' && !day.checkOut) {
        day.checkOut = rec;
      } else {
        day.other.push(rec);
      }
    });

    // Sort descending by date
    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const renderBadge = (type: string) => {
    switch (type) {
      case 'SICK': return <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Sakit</span>;
      case 'PERMIT': return <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Izin</span>;
      case 'ALPHA': return <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Alpha</span>;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Riwayat Absensi: {userName}</h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Lihat dan kelola absensi untuk karyawan ini.</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 500, display: 'block' }}>Pilih Bulan:</label>
              <input 
                type="month" 
                className="input-field" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                style={{ padding: '0.25rem 0.5rem' }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => openAddModal('CHECK_IN')}>
            <Plus size={16} /> Tambah Absensi
          </button>
        </div>

        <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat data...</div>
          ) : groupedData.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Tidak ada data absensi di bulan ini.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Check In (Masuk)</th>
                  <th>Check Out (Pulang)</th>
                  <th>Status / Izin</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((row) => (
                  <tr key={row.date}>
                    <td style={{ fontWeight: 500 }}>
                      {format(new Date(row.date), 'dd MMM yyyy')}
                    </td>
                    
                    {/* Check In */}
                    <td>
                      {row.checkIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontWeight: 500 }}>{format(new Date(row.checkIn.timestamp), 'HH:mm')}</div>
                          {row.checkIn.isLate && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Terlambat</span>}
                          <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none' }} onClick={() => openEditModal(row.checkIn!)} title="Edit Check In">
                              <Edit size={12} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(row.checkIn!.id)} title="Hapus">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>

                    {/* Check Out */}
                    <td>
                      {row.checkOut ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontWeight: 500 }}>{format(new Date(row.checkOut.timestamp), 'HH:mm')}</div>
                          <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none' }} onClick={() => openEditModal(row.checkOut!)} title="Edit Check Out">
                              <Edit size={12} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(row.checkOut!.id)} title="Hapus">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>

                    {/* Status/Izin */}
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {row.other.map(rec => (
                          <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {renderBadge(rec.type)}
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none' }} onClick={() => openEditModal(rec)}>
                              <Edit size={12} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(rec.id)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {row.checkIn?.notes && <div style={{marginBottom: '0.25rem'}}>In: {row.checkIn.notes}</div>}
                      {row.checkOut?.notes && <div style={{marginBottom: '0.25rem'}}>Out: {row.checkOut.notes}</div>}
                      {row.other.map(o => o.notes ? <div key={o.id}>{o.type}: {o.notes}</div> : null)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Nested Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Tambah Data Manual' : 'Edit Data'}</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Jenis Absen/Keterangan</label>
                <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="CHECK_IN">Masuk (CHECK IN)</option>
                  <option value="CHECK_OUT">Pulang (CHECK OUT)</option>
                  <option value="SICK">Sakit (SICK)</option>
                  <option value="PERMIT">Izin (PERMIT)</option>
                  <option value="ALPHA">Bolos (ALPHA)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Waktu & Tanggal</label>
                <input required type="datetime-local" className="input-field" value={formData.timestamp} onChange={(e) => setFormData({...formData, timestamp: e.target.value})} />
              </div>

              {formData.type === 'CHECK_IN' && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.isLate} 
                      onChange={(e) => setFormData({...formData, isLate: e.target.checked})} 
                    />
                    Tandai sebagai Terlambat
                  </label>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Catatan Khusus</label>
                <textarea className="input-field" rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Alasan terlambat / izin / dll" />
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAttendanceModal;

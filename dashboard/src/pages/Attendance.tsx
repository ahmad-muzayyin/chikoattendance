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
    id: string;
    name: string;
    role: string;
  };
}

const Attendance = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    notes: '',
    isLate: false
  });

  useEffect(() => {
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

  const openAddModal = (userId = '', type = 'CHECK_IN') => {
    setModalMode('add');
    const targetDate = new Date(selectedDate);
    const now = new Date();
    
    targetDate.setHours(now.getHours(), now.getMinutes());

    const localDateTime = new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: userId || (employees.length > 0 ? employees[0].id : ''),
      type,
      timestamp: localDateTime,
      notes: 'Ditambahkan manual dari dashboard',
      isLate: false
    });
    setShowModal(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setModalMode('edit');
    setSelectedRecordId(record.id);
    const dateObj = new Date(record.timestamp);
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      userId: '',
      type: record.type,
      timestamp: localDateTime,
      notes: record.notes || '',
      isLate: record.isLate
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus data absen ini?')) {
      try {
        await apiClient.delete(`/admin/attendance/${id}`);
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
      } else {
        await apiClient.put(`/admin/attendance/${selectedRecordId}`, formData);
      }
      setShowModal(false);
      fetchDailyAttendance();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Gagal menyimpan data');
    }
  };

  // Group records by User
  const groupedData = React.useMemo(() => {
    const map = new Map<string, {
      user: { id: string; name: string; role: string },
      checkIn?: AttendanceRecord,
      checkOut?: AttendanceRecord,
      other: AttendanceRecord[]
    }>();

    records.forEach(rec => {
      if (!rec.User) return;
      if (!map.has(rec.User.id)) {
        map.set(rec.User.id, { user: rec.User, other: [] });
      }
      const u = map.get(rec.User.id)!;
      if (rec.type === 'CHECK_IN' && !u.checkIn) {
        u.checkIn = rec;
      } else if (rec.type === 'CHECK_OUT' && !u.checkOut) {
        u.checkOut = rec;
      } else {
        u.other.push(rec);
      }
    });

    const filteredMap = Array.from(map.values()).filter(row => 
      row.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredMap;
  }, [records, searchQuery]);

  const renderBadge = (type: string) => {
    switch (type) {
      case 'SICK': return <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Sakit</span>;
      case 'PERMIT': return <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Izin</span>;
      case 'ALPHA': return <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>Alpha</span>;
      default: return null;
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Pemantauan Absensi Harian</h1>
        <button className="btn btn-primary" onClick={() => openAddModal('', 'SICK')}>
          <Plus size={18} /> Tambah Data
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cari Nama Karyawan:</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ketik nama karyawan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="card table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Memuat data...</div>
        ) : groupedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            Belum ada karyawan yang absen atau izin pada tanggal ini.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama Karyawan</th>
                <th>Check In (Masuk)</th>
                <th>Check Out (Pulang)</th>
                <th>Status / Izin</th>
                <th>Catatan Khusus</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((row) => (
                <tr key={row.user.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.user.role}</div>
                  </td>
                  
                  {/* Check In Column */}
                  <td>
                    {row.checkIn ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontWeight: 500 }}>{format(new Date(row.checkIn.timestamp), 'HH:mm')}</div>
                        {row.checkIn.isLate && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Terlambat</span>}
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => openEditModal(row.checkIn!)} title="Edit Check In">
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(row.checkIn!.id)} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openAddModal(row.user.id, 'CHECK_IN')}>
                        + Isi Masuk
                      </button>
                    )}
                  </td>

                  {/* Check Out Column */}
                  <td>
                    {row.checkOut ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontWeight: 500 }}>{format(new Date(row.checkOut.timestamp), 'HH:mm')}</div>
                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: 'auto' }}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => openEditModal(row.checkOut!)} title="Edit Check Out">
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(row.checkOut!.id)} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openAddModal(row.user.id, 'CHECK_OUT')}>
                        + Isi Pulang
                      </button>
                    )}
                  </td>

                  {/* Other Statuses Column */}
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {row.other.map(rec => (
                        <div key={rec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {renderBadge(rec.type)}
                          <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none' }} onClick={() => openEditModal(rec)} title="Edit Izin/Sakit">
                            <Edit size={12} />
                          </button>
                          <button className="btn btn-outline" style={{ padding: '0.2rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(rec.id)} title="Hapus">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {row.other.length === 0 && (
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderStyle: 'dashed' }} onClick={() => openAddModal(row.user.id, 'SICK')}>
                          + Izin/Sakit
                        </button>
                      )}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Tambah Data Manual' : 'Edit Data'}</h2>
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

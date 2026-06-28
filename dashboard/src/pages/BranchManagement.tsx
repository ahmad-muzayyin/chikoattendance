import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Trash2, Edit, Plus, X, MapPin } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  startHour: string;
  endHour: string;
}

const BranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    radius: 100,
    startHour: '08:00',
    endHour: '17:00'
  });

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Failed to fetch branches', error);
      alert('Gagal mengambil data outlet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', address: '', latitude: 0, longitude: 0, radius: 100, startHour: '08:00', endHour: '17:00' });
    setShowModal(true);
  };

  const openEditModal = (branch: Branch) => {
    setModalMode('edit');
    setSelectedId(branch.id);
    setFormData({ 
      name: branch.name, 
      address: branch.address, 
      latitude: branch.latitude, 
      longitude: branch.longitude, 
      radius: branch.radius,
      startHour: branch.startHour,
      endHour: branch.endHour
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus outlet ini? Aksi ini tidak dapat dibatalkan.')) {
      try {
        await apiClient.delete(`/branches/${id}`);
        alert('Outlet berhasil dihapus');
        fetchBranches();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Gagal menghapus outlet');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await apiClient.post('/branches', formData);
        alert('Outlet berhasil ditambahkan');
      } else {
        await apiClient.put(`/branches/${selectedId}`, formData);
        alert('Outlet berhasil diupdate');
      }
      setShowModal(false);
      fetchBranches();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Manajemen Outlet (Cabang)</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah Outlet
        </button>
      </div>

      <div className="grid">
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Memuat data outlet...</div>
        ) : branches.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)' }}>Belum ada data outlet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', width: '100%' }}>
            {branches.map(branch => (
              <div key={branch.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{branch.name}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none' }} onClick={() => openEditModal(branch)}>
                      <Edit size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.25rem', border: 'none', color: 'var(--danger-color)' }} onClick={() => handleDelete(branch.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{branch.address}</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: 'var(--border-radius)' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Jam Operasional</div>
                    <div>{branch.startHour} - {branch.endHour}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Radius Absen</div>
                    <div>{branch.radius} meter</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Tambah Outlet Baru' : 'Edit Outlet'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nama Outlet</label>
                <input required type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Cabang Jakarta Pusat" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Alamat Lengkap</label>
                <textarea required className="input-field" rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Latitude</label>
                  <input required type="number" step="any" className="input-field" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Longitude</label>
                  <input required type="number" step="any" className="input-field" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})} />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
                Gunakan Google Maps untuk mendapatkan titik koordinat (Latitude & Longitude).
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Jam Buka</label>
                  <input required type="time" className="input-field" value={formData.startHour} onChange={(e) => setFormData({...formData, startHour: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Jam Tutup</label>
                  <input required type="time" className="input-field" value={formData.endHour} onChange={(e) => setFormData({...formData, endHour: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Radius (meter)</label>
                  <input required type="number" className="input-field" value={formData.radius} onChange={(e) => setFormData({...formData, radius: Number(e.target.value)})} />
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Outlet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchManagement;

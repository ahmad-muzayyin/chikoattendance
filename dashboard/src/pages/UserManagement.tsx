import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Trash2, Edit, Plus, X } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  baseSalary: number;
  branchId?: number | string;
  Branch?: {
    name: string;
  };
}

const UserManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [branches, setBranches] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // required for add, optional for edit
    role: 'STAFF',
    baseSalary: 0,
    branchId: ''
  });

  const fetchData = async () => {
    try {
      const [empRes, branchRes] = await Promise.all([
        apiClient.get('/admin/employees'),
        apiClient.get('/branches')
      ]);
      setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
    } catch (error) {
      console.error('Failed to fetch data', error);
      alert('Gagal mengambil data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', password: '', role: 'STAFF', baseSalary: 0, branchId: '' });
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setModalMode('edit');
    setSelectedId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '', // leave empty unless they want to change
      role: emp.role,
      baseSalary: emp.baseSalary,
      branchId: emp.branchId?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini? Aksi ini tidak dapat dibatalkan.')) {
      try {
        await apiClient.delete(`/admin/users/${id}`);
        alert('User berhasil dihapus');
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Gagal menghapus user');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.branchId) delete (payload as any).branchId;

      if (modalMode === 'add') {
        await apiClient.post('/admin/users', payload);
        alert('User berhasil ditambahkan');
      } else {
        const dataToUpdate = { ...payload };
        if (!dataToUpdate.password) delete (dataToUpdate as any).password;
        await apiClient.put(`/admin/users/${selectedId}`, dataToUpdate);
        alert('User berhasil diupdate');
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Manajemen Karyawan</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Tambah User
        </button>
      </div>

      <div className="card table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat data...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Outlet</th>
                <th>Gaji Pokok</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(employees) || employees.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Tidak ada data karyawan
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 500 }}>{emp.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                    <td>
                      <span className={`badge ${emp.role === 'OWNER' ? 'badge-danger' : emp.role === 'HEAD' ? 'badge-primary' : 'badge-success'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>{emp.Branch?.name || '-'}</td>
                    <td>Rp {emp.baseSalary?.toLocaleString('id-ID')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }} onClick={() => openEditModal(emp)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem' }} onClick={() => handleDelete(emp.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{modalMode === 'add' ? 'Tambah User Baru' : 'Edit User'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nama Lengkap</label>
                <input required type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
                <input required type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Password {modalMode === 'edit' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>(Kosongkan jika tidak ingin diubah)</span>}
                </label>
                <input required={modalMode === 'add'} type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Role</label>
                  <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="STAFF">Staff</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="HEAD">Head (Kepala Cabang)</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Penempatan Outlet</label>
                  <select className="input-field" value={formData.branchId} onChange={(e) => setFormData({...formData, branchId: e.target.value})}>
                    <option value="">-- Pilih Outlet --</option>
                    {Array.isArray(branches) && branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Gaji Pokok</label>
                <input required type="number" className="input-field" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})} />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

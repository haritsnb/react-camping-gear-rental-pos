import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Category, Brand, Role, User } from '@/types';
import Swal from 'sweetalert2';
import {
  Sliders,
  Tag,
  Award,
  Shield,
  UserCheck,
  Plus,
  Pen,
  Trash2,
  RotateCcw,
  Skull,
  ShieldAlert,
  X,
  Lock,
  Phone,
  User as UserIcon
} from 'lucide-react';

export const MasterData: React.FC = () => {
  // Sub-tab: 'categories' | 'brands' | 'roles' | 'users'
  const [subTab, setSubTab] = useState<'categories' | 'brands' | 'roles' | 'users'>('categories');
  const [loading, setLoading] = useState(false);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Trash Mode per Sub-tab
  const [trashMode, setTrashMode] = useState<{ [key: string]: boolean }>({
    categories: false,
    brands: false,
    roles: false,
    users: false,
  });

  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  // Form State: Kategori & Brand
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActiveBrand, setIsActiveBrand] = useState(true);

  // Form State: User
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRoleId, setUserRoleId] = useState<number | ''>('');
  const [userPhone, setUserPhone] = useState('');

  const isCurrentTrash = trashMode[subTab];

  // ==========================================
  // FETCH DATA HANDLERS
  // ==========================================
  const fetchData = async () => {
    setLoading(true);
    try {
      if (subTab === 'categories') {
        const url = isCurrentTrash ? '/categories/deleted' : '/categories';
        const res = await api.get(url);
        setCategories(res.data.data || []);
      } else if (subTab === 'brands') {
        const url = isCurrentTrash ? '/brands/deleted' : '/brands';
        const res = await api.get(url);
        setBrands(res.data.data || []);
      } else if (subTab === 'roles') {
        const url = isCurrentTrash ? '/roles/deleted' : '/roles';
        const res = await api.get(url);
        setRoles(res.data.data || []);
      } else if (subTab === 'users') {
        const url = isCurrentTrash ? '/users/deleted' : '/users';
        const [uRes, rRes] = await Promise.all([api.get(url), api.get('/roles')]);
        setUsers(uRes.data.data || []);
        setRoles(rRes.data.data || []);
      }
    } catch {
      Swal.fire('Error', `Gagal memuat data ${subTab}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subTab, trashMode[subTab]]);

  const toggleTrash = (val: boolean) => {
    setTrashMode((prev) => ({ ...prev, [subTab]: val }));
  };

  // ==========================================
  // MODAL & CRUD HANDLERS
  // ==========================================

  // Buka Modal Category / Brand / Role
  const handleOpenSimpleModal = (type: 'categories' | 'brands' | 'roles', item?: any) => {
    if (item) {
      setEditId(item.id);
      setName(item.name);
      setDescription(item.description || '');
      if (type === 'brands') setIsActiveBrand(item.is_active ?? true);
    } else {
      setEditId(null);
      setName('');
      setDescription('');
      setIsActiveBrand(true);
    }
    setActiveModal(type);
  };

  // Submit Category / Brand / Role
  const handleSubmitSimple = async (e: React.FormEvent, endpoint: string) => {
    e.preventDefault();
    const payload: any = { name, description };
    if (endpoint === 'brands') payload.is_active = isActiveBrand;

    try {
      if (editId) {
        await api.put(`/${endpoint}/${editId}`, payload);
        Swal.fire('Sukses', `Data ${endpoint} berhasil diperbarui`, 'success');
      } else {
        await api.post(`/${endpoint}`, payload);
        Swal.fire('Sukses', `Data ${endpoint} berhasil ditambahkan`, 'success');
      }
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Buka Modal User
  const handleOpenUserModal = (userItem?: User) => {
    if (userItem) {
      setEditId(userItem.id);
      setUserName(userItem.name);
      setUserUsername(userItem.username);
      setUserRoleId(userItem.role_id);
      setUserPhone(userItem.phone || '');
      setUserPassword('');
    } else {
      setEditId(null);
      setUserName('');
      setUserUsername('');
      setUserRoleId(roles[0]?.id || 2);
      setUserPhone('');
      setUserPassword('');
    }
    setActiveModal('users');
  };

  // Submit User
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: userName,
      username: userUsername,
      role_id: Number(userRoleId),
      phone: userPhone || undefined,
    };
    if (userPassword) {
      payload.password = userPassword;
    }

    try {
      if (editId) {
        await api.put(`/users/${editId}`, payload);
        Swal.fire('Sukses', 'Akun user berhasil diperbarui', 'success');
      } else {
        if (!userPassword) {
          return Swal.fire('Peringatan', 'Password wajib diisi untuk user baru', 'warning');
        }
        await api.post('/users', payload);
        Swal.fire('Sukses', 'Akun user baru berhasil didaftarkan', 'success');
      }
      setActiveModal(null);
      fetchData();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Generic Action: Soft Delete / Restore / Force Delete
  const handleAction = (resource: string, id: number, actionType: 'soft' | 'restore' | 'force') => {
    const isForce = actionType === 'force';
    const isRestore = actionType === 'restore';

    if (isRestore) {
      api.post(`/${resource}/${id}`).then(() => {
        Swal.fire('Dipulihkan!', `Data ${resource} ID ${id} kembali aktif.`, 'success');
        fetchData();
      }).catch((err) => {
        Swal.fire('Gagal Restore', err.response?.data?.message || 'Gagal restore data', 'error');
      });
      return;
    }

    Swal.fire({
      title: isForce ? `⚠️ Hapus Permanen ${resource} ID: ${id}?` : `Soft Delete ${resource} ID: ${id}?`,
      text: isForce ? 'Data akan dihapus selamanya dari database!' : 'Data akan dipindahkan ke kotak sampah (Trash).',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/${resource}/${id}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Data telah diproses.', 'success');
          fetchData();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-green-700" />
            <span>Master Data & Pengaturan Sistem</span>
          </h1>
          <p className="text-xs text-slate-500">Pengelolaan kategori, merek/brand, roles wewenang, dan akun pengguna (RBAC)</p>
        </div>

        {/* Toggle Aktif vs Sampah */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => toggleTrash(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !isCurrentTrash ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => toggleTrash(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                isCurrentTrash ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sampah</span>
            </button>
          </div>

          {!isCurrentTrash && (
            <button
              onClick={() => {
                if (subTab === 'users') handleOpenUserModal();
                else handleOpenSimpleModal(subTab);
              }}
              className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah {subTab === 'categories' ? 'Kategori' : subTab === 'brands' ? 'Brand' : subTab === 'roles' ? 'Role' : 'User'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtab Navigator */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex space-x-1.5 overflow-x-auto">
        <button
          onClick={() => setSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'categories' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori Produk</span>
        </button>

        <button
          onClick={() => setSubTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'brands' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Merek / Brand</span>
        </button>

        <button
          onClick={() => setSubTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'roles' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Wewenang</span>
        </button>

        <button
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            subTab === 'users' ? 'bg-green-700 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Akun Pengguna (Users)</span>
        </button>
      </div>

      {/* Tabel Data Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isCurrentTrash && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Menampilkan data {subTab} yang di-soft delete. Klik Restore untuk mengembalikan atau Hard Delete untuk menghapus permanen.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          {/* TABEL 1: KATEGORI */}
          {subTab === 'categories' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Kategori</th>
                  <th className="p-3">Deskripsi</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">Memuat kategori...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">{isCurrentTrash ? 'Kotak sampah kategori kosong' : 'Belum ada kategori'}</td></tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className={`hover:bg-slate-50 transition ${isCurrentTrash ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{c.id}</td>
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 text-slate-500">{c.description || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentTrash ? (
                            <>
                              <button onClick={() => handleAction('categories', c.id, 'restore')} className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /><span>Restore</span>
                              </button>
                              <button onClick={() => handleAction('categories', c.id, 'force')} className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <Skull className="w-3 h-3" /><span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleOpenSimpleModal('categories', c)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition" title="Edit">
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleAction('categories', c.id, 'soft')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition" title="Soft Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABEL 2: BRANDS */}
          {subTab === 'brands' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Brand</th>
                  <th className="p-3">Deskripsi</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">Memuat brand...</td></tr>
                ) : brands.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-400">{isCurrentTrash ? 'Kotak sampah brand kosong' : 'Belum ada brand'}</td></tr>
                ) : (
                  brands.map((b) => (
                    <tr key={b.id} className={`hover:bg-slate-50 transition ${isCurrentTrash ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{b.id}</td>
                      <td className="p-3 font-bold text-slate-900">{b.name}</td>
                      <td className="p-3 text-slate-500">{b.description || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-800 border border-green-200">
                          AKTIF
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentTrash ? (
                            <>
                              <button onClick={() => handleAction('brands', b.id, 'restore')} className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /><span>Restore</span>
                              </button>
                              <button onClick={() => handleAction('brands', b.id, 'force')} className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <Skull className="w-3 h-3" /><span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleOpenSimpleModal('brands', b)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition" title="Edit">
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleAction('brands', b.id, 'soft')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition" title="Soft Delete">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABEL 3: ROLES */}
          {subTab === 'roles' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Role</th>
                  <th className="p-3">Deskripsi Wewenang</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">Memuat role...</td></tr>
                ) : roles.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">{isCurrentTrash ? 'Kotak sampah role kosong' : 'Belum ada role'}</td></tr>
                ) : (
                  roles.map((r) => (
                    <tr key={r.id} className={`hover:bg-slate-50 transition ${isCurrentTrash ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{r.id}</td>
                      <td className="p-3 font-bold uppercase text-slate-900">{r.name}</td>
                      <td className="p-3 text-slate-500">{r.description || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentTrash ? (
                            <>
                              <button onClick={() => handleAction('roles', r.id, 'restore')} className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /><span>Restore</span>
                              </button>
                              <button onClick={() => handleAction('roles', r.id, 'force')} className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <Skull className="w-3 h-3" /><span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleOpenSimpleModal('roles', r)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition" title="Edit">
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              {r.id !== 1 && (
                                <button onClick={() => handleAction('roles', r.id, 'soft')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition" title="Soft Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TABEL 4: USERS */}
          {subTab === 'users' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role Akses</th>
                  <th className="p-3">No. HP</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">Memuat data user...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">{isCurrentTrash ? 'Kotak sampah user kosong' : 'Belum ada akun user'}</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition ${isCurrentTrash ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{u.id}</td>
                      <td className="p-3 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3 font-mono text-slate-600">{u.username}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold text-[9px] uppercase bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role_name}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{u.phone || '-'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-800 border border-green-200">
                          AKTIF
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isCurrentTrash ? (
                            <>
                              <button onClick={() => handleAction('users', u.id, 'restore')} className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /><span>Restore</span>
                              </button>
                              <button onClick={() => handleAction('users', u.id, 'force')} className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1">
                                <Skull className="w-3 h-3" /><span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleOpenUserModal(u)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition" title="Edit User">
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              {u.id !== 1 && (
                                <button onClick={() => handleAction('users', u.id, 'soft')} className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition" title="Soft Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL: KATEGORI / BRAND / ROLE             */}
      {/* ========================================== */}
      {activeModal && activeModal !== 'users' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editId ? `Edit ${activeModal} ID: ${editId}` : `Tambah ${activeModal}`}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmitSimple(e, activeModal)} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama {activeModal}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={`Contoh: ${activeModal === 'categories' ? 'Tenda Dome' : activeModal === 'brands' ? 'Eiger' : 'Manager'}`}
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Tambahan</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Keterangan singkat..."
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: AKUN USER                           */}
      {/* ========================================== */}
      {activeModal === 'users' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editId ? `Edit User ID: ${editId}` : 'Tambah Akun User Baru'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  placeholder="Contoh: Rian Kasir"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username Login</label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      required
                      placeholder="rian_kasir"
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Wewenang</label>
                  <select
                    value={userRoleId}
                    onChange={(e) => setUserRoleId(Number(e.target.value))}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password {editId && <span className="font-normal text-slate-400">(Opsional)</span>}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={editId ? 'Kosongkan jika tdk ubah' : 'Min. 6 Karakter'}
                      required={!editId}
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Telepon</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full pl-8 pr-2.5 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
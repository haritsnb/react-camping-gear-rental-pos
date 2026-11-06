import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Customer } from '@/types';
import Swal from 'sweetalert2';
import {
  Users,
  UserPlus,
  Pen,
  Trash2,
  RotateCcw,
  Skull,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  X,
  Phone,
  MapPin,
  Mail,
  AlertTriangle
} from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [identityType, setIdentityType] = useState<'KTP' | 'SIM' | 'Paspor'>('KTP');
  const [identityNumber, setIdentityNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Fetch Pelanggan (Aktif / Sampah)
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = isTrashView ? '/customers/deleted' : '/customers';
      const res = await api.get(url);
      setCustomers(res.data.data || []);
    } catch {
      Swal.fire('Error', 'Gagal memuat data pelanggan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [isTrashView]);

  // Buka Modal (Tambah / Edit)
  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditCustomerId(customer.id);
      setName(customer.name);
      setIdentityType(customer.identity_type);
      setIdentityNumber(customer.identity_number);
      setPhone(customer.phone);
      setEmergencyContact(customer.emergency_contact || '');
      setEmail(customer.email || '');
      setAddress(customer.address);
      setNotes(customer.notes || '');
    } else {
      setEditCustomerId(null);
      setName('');
      setIdentityType('KTP');
      setIdentityNumber('');
      setPhone('');
      setEmergencyContact('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  // Submit Form (Multipart Form-Data)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('identity_type', identityType);
    formData.append('identity_number', identityNumber);
    formData.append('phone', phone);
    formData.append('emergency_contact', emergencyContact);
    formData.append('email', email);
    formData.append('address', address);
    formData.append('notes', notes);
    if (photoFile) {
      formData.append('identity_photo', photoFile);
    }

    try {
      if (editCustomerId) {
        await api.put(`/customers/${editCustomerId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Swal.fire('Sukses', 'Data pelanggan berhasil diperbarui', 'success');
      } else {
        await api.post('/customers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Swal.fire('Sukses', 'Pelanggan KYC berhasil didaftarkan', 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Toggle Blacklist Status
  const handleToggleBlacklist = (customer: Customer) => {
    const nextStatus = !customer.is_blacklisted;
    Swal.fire({
      title: nextStatus ? 'Blacklist Pelanggan Ini?' : 'Buka Blacklist Pelanggan?',
      text: nextStatus
        ? `${customer.name} tidak akan bisa melakukan booking sewa alat lagi.`
        : `Akses booking untuk ${customer.name} akan diizinkan kembali.`,
      icon: nextStatus ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: nextStatus ? 'Ya, Blacklist' : 'Ya, Buka Blokir',
      confirmButtonColor: nextStatus ? '#e11d48' : '#16a34a',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.patch(`/customers/${customer.id}/blacklist`, {
            is_blacklisted: nextStatus,
          });
          Swal.fire('Sukses', 'Status blacklist pelanggan berhasil diperbarui', 'success');
          fetchCustomers();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Gagal mengubah status', 'error');
        }
      }
    });
  };

  // Soft Delete & Force Delete
  const handleDelete = (id: number, isForce: boolean) => {
    Swal.fire({
      title: isForce ? '⚠️ Hapus Permanen Pelanggan?' : 'Soft Delete Pelanggan?',
      text: isForce
        ? 'Data pelanggan dan riwayat KYC akan dihapus selamanya dari database!'
        : 'Data pelanggan akan dipindahkan ke kotak sampah (Trash).',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/customers/${id}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Data pelanggan telah diproses.', 'success');
          fetchCustomers();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan', 'error');
        }
      }
    });
  };

  // Restore Pelanggan
  const handleRestore = async (id: number) => {
    try {
      await api.post(`/customers/${id}`);
      Swal.fire('Dipulihkan!', `Pelanggan ID ${id} kembali aktif.`, 'success');
      fetchCustomers();
    } catch (err: any) {
      Swal.fire('Gagal Restore', err.response?.data?.message || 'Gagal restore data', 'error');
    }
  };

  // FUNGSI HELPER: Arahkan URL relatif foto ke Host Backend (Port 8080)
  const getPhotoUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    
    // Ambil base url backend (contoh: http://localhost:8080/api -> http://localhost:8080)
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const backendOrigin = apiBase.replace(/\/api\/?$/, '');
    
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-700" />
            <span>Pelanggan & Verifikasi Identitas (KYC)</span>
          </h1>
          <p className="text-xs text-slate-500">Pendaftaran identitas fisik, upload KTP/SIM, dan proteksi blacklist</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Aktif vs Sampah */}
          <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setIsTrashView(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !isTrashView ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setIsTrashView(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                isTrashView ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sampah</span>
            </button>
          </div>

          {!isTrashView && (
            <button
              onClick={() => handleOpenModal()}
              className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pelanggan</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel Pelanggan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isTrashView && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Menampilkan data pelanggan yang di-soft delete. Klik Restore untuk mengembalikan atau Hard Delete untuk menghapus permanen.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Nomor Identitas</th>
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Kontak & Darurat</th>
                <th className="p-3">Alamat</th>
                <th className="p-3 text-center">Foto KYC</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Memuat data pelanggan...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {isTrashView ? 'Kotak sampah pelanggan kosong' : 'Belum ada data pelanggan terdaftar'}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50 transition ${isTrashView ? 'bg-rose-50/20' : ''}`}>
                    <td className="p-3 font-mono font-bold text-slate-700">{c.id}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <span className="text-[10px] text-slate-400 block font-normal">{c.identity_type}</span>
                      {c.identity_number}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{c.name}</td>
                    <td className="p-3 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.emergency_contact && (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>Darurat: {c.emergency_contact}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate" title={c.address}>
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>{c.address}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {c.identity_photo_url ? (
                        <a
                          href={getPhotoUrl(c.identity_photo_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold underline"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {c.is_blacklisted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                          <ShieldX className="w-3 h-3" />
                          <span>BLACKLIST</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-800 border border-green-200">
                          <ShieldCheck className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isTrashView ? (
                          <>
                            <button
                              onClick={() => handleRestore(c.id)}
                              className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, true)}
                              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                            >
                              <Skull className="w-3 h-3" />
                              <span>Hard Delete</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleBlacklist(c)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                c.is_blacklisted
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                              title={c.is_blacklisted ? 'Buka Blacklist' : 'Kunci Blacklist'}
                            >
                              {c.is_blacklisted ? 'Unblock' : 'Blacklist'}
                            </button>
                            <button
                              onClick={() => handleOpenModal(c)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                              title="Edit Data Pelanggan"
                            >
                              <Pen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, false)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                              title="Soft Delete"
                            >
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
        </div>
      </div>

      {/* MODAL FORM PELANGGAN & UPLOAD KYC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editCustomerId ? `Edit Data Pelanggan ID: ${editCustomerId}` : 'Registrasi Pelanggan & Upload KYC'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Sesuai Identitas</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Budi Pratama"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Identitas</label>
                  <select
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value as any)}
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="KTP">KTP</option>
                    <option value="SIM">SIM</option>
                    <option value="Paspor">Paspor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Identitas Unik</label>
                  <input
                    type="text"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    required
                    placeholder="3201..."
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="0812..."
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Darurat (Kerabat)</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="0812... (Istri/Ortu)"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Pelanggan (Opsional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Domisili Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={2}
                  placeholder="Jl. Sukajadi No. 128, Bandung"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Foto Kartu Identitas (KYC)
                  {editCustomerId && <span className="font-normal text-slate-400 ml-1">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-200 p-1.5 rounded-xl text-[11px] bg-slate-50 outline-none file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Member komunitas pendaki"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { User, InviteLink } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Crown, ShieldAlert, Users, Link as LinkIcon, UserPlus, Trash2, 
  Power, RefreshCw, KeyRound, Copy, Check, Search, X, Clock, Monitor, 
  Smartphone, ShieldCheck, AlertTriangle, Plus, Globe
} from 'lucide-react';

interface OwnerPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({ isOpen, onClose }) => {
  const { token, user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'invites' | 'security'>('users');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'active' | 'disabled'>('all');

  // Modals & Forms
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'owner'>('user');
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Invite Link Form
  const [expiryDays, setExpiryDays] = useState('never');
  const [maxUses, setMaxUses] = useState('1');
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Reset Password State
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [resetPassValue, setResetPassValue] = useState('');

  // Copy Feedback
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : ''
  });

  const fetchData = async () => {
    if (!isOpen || !token) return;
    setIsLoading(true);
    try {
      const [resUsers, resInvites] = await Promise.all([
        fetch('/api/owner/users', { headers: getHeaders() }),
        fetch('/api/owner/invites', { headers: getHeaders() })
      ]);

      if (resUsers.ok) {
        const uData = await resUsers.json();
        setUsers(uData);
      }
      if (resInvites.ok) {
        const iData = await resInvites.json();
        setInvites(iData);
      }
    } catch (err) {
      console.error('Failed to fetch owner data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // USER MANAGEMENT ACTIONS
  const handleToggleUserStatus = async (userItem: User) => {
    const newStatus = userItem.status === 'active' ? 'disabled' : 'active';
    const actionText = newStatus === 'disabled' ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!confirm(`Apakah Anda yakin ingin ${actionText} user "${userItem.name}"?`)) return;

    try {
      const res = await fetch(`/api/owner/users/${userItem.id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah status user.');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleForceLogout = async (userItem: User) => {
    if (!confirm(`Cabut sesi login & logout paksa user "${userItem.name}" dari perangkatnya?`)) return;

    try {
      const res = await fetch(`/api/owner/users/${userItem.id}/force-logout`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        alert(`Sesi user "${userItem.name}" telah dicabut.`);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mencabut sesi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleDeleteUser = async (userItem: User) => {
    if (!confirm(`Hapus permanen akun "${userItem.name}" (@${userItem.username})? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/owner/users/${userItem.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus user.');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);

    if (!newUsername || !newName || !newEmail || !newPassword) {
      setAddUserError('Semua field wajib diisi.');
      return;
    }

    try {
      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddUserOpen(false);
        setNewUsername('');
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        fetchData();
      } else {
        setAddUserError(data.error || 'Gagal menambahkan user.');
      }
    } catch (e) {
      setAddUserError('Terjadi kesalahan jaringan.');
    }
  };

  const handleResetPasswordSubmit = async (userId: string) => {
    if (!resetPassValue || resetPassValue.length < 6) {
      alert('Password baru minimal 6 karakter.');
      return;
    }

    try {
      const res = await fetch(`/api/owner/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ newPassword: resetPassValue })
      });

      if (res.ok) {
        alert('Password berhasil diperbarui.');
        setResetPassUserId(null);
        setResetPassValue('');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mereset password.');
      }
    } catch (e) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  // INVITE LINK ACTIONS
  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner/invites', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          expiryDays,
          maxUses
        })
      });

      const data = await res.json();
      if (res.ok && data.invite) {
        const fullUrl = `${window.location.origin}/?invite=${data.invite.token}`;
        setCreatedInviteUrl(fullUrl);
        fetchData();
      } else {
        alert(data.error || 'Gagal membuat invite link.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Cabut dan hapus link undangan ini?')) return;
    try {
      const res = await fetch(`/api/owner/invites/${inviteId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      alert('Gagal mencabut invite link.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInviteId(id);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'online') return u.isOnline;
    if (statusFilter === 'active') return u.status === 'active';
    if (statusFilter === 'disabled') return u.status === 'disabled';
    return true;
  });

  const onlineCount = users.filter((u) => u.isOnline).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Owner Admin Panel</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
                  Hak Akses Penuh
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola Pengguna, Role, Link Undangan & Sesi Login Aktif
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manajemen User ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'invites'
                  ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Invite Links ({invites.length})</span>
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Pengguna</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{users.length}</div>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Online Sekarang</span>
                  </div>
                  <div className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{onlineCount}</div>
                </div>
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl">
                  <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">Akun Aktif</div>
                  <div className="text-xl font-black text-indigo-800 dark:text-indigo-300 mt-0.5">
                    {users.filter((u) => u.status === 'active').length}
                  </div>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Akun Nonaktif</div>
                  <div className="text-xl font-black text-rose-800 dark:text-rose-300 mt-0.5">
                    {users.filter((u) => u.status === 'disabled').length}
                  </div>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama, username, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-none"
                  >
                    <option value="all">Semua Status</option>
                    <option value="online">Hanya Online</option>
                    <option value="active">Hanya Aktif</option>
                    <option value="disabled">Hanya Nonaktif</option>
                  </select>

                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah User</span>
                  </button>
                </div>
              </div>

              {/* Users List Table / Cards */}
              <div className="space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada pengguna yang cocok.
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        u.status === 'disabled'
                          ? 'bg-rose-950/10 border-rose-200 dark:border-rose-900/40 opacity-75'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      {/* User Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">{u.name}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">@{u.username}</span>

                          {/* Role Badge */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                              u.role === 'owner'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            {u.role === 'owner' ? 'Owner' : 'User'}
                          </span>

                          {/* Online Indicator */}
                          {u.isOnline ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-md">
                              Offline
                            </span>
                          )}

                          {/* Status Badge */}
                          {u.status === 'disabled' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-md">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Email: <strong className="text-slate-700 dark:text-slate-300">{u.email}</strong></span>
                          <span>&bull;</span>
                          <span>
                            Login Terakhir:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah'}
                            </strong>
                          </span>
                        </div>

                        {/* Device Info */}
                        {u.currentDeviceInfo && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span>
                              {u.currentDeviceInfo.device} ({u.currentDeviceInfo.os} &bull; {u.currentDeviceInfo.browser})
                            </span>
                          </div>
                        )}

                        {/* Reset Password Prompt Inline */}
                        {resetPassUserId === u.id && (
                          <div className="mt-2 p-2.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 space-y-2 max-w-sm">
                            <div className="text-xs font-bold">Reset Password untuk @{u.username}</div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Password baru..."
                                value={resetPassValue}
                                onChange={(e) => setResetPassValue(e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                              />
                              <button
                                onClick={() => handleResetPasswordSubmit(u.id)}
                                className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setResetPassUserId(null)}
                                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                        
                        {/* Force Logout */}
                        <button
                          onClick={() => handleForceLogout(u)}
                          className="p-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Cabut sesi login paksa dari perangkat user"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">Logout Paksa</span>
                        </button>

                        {/* Toggle Active / Disabled */}
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1.5 text-xs font-bold border rounded-lg transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-rose-200 dark:border-rose-900'
                                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900'
                            }`}
                          >
                            {u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setResetPassUserId(u.id);
                            setResetPassValue('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Reset Password User"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Delete User */}
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Akun User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: INVITE LINKS MANAGEMENT */}
          {activeTab === 'invites' && (
            <div className="space-y-5">
              
              {/* Generate New Invite Form */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl border border-slate-700 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Buat Link Undangan (Invite Link) Baru</span>
                </div>

                <form onSubmit={handleGenerateInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold">Masa Berlaku Link</label>
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none"
                    >
                      <option value="never">Selamanya (Sampai Web Hilang)</option>
                      <option value="1">1 Hari</option>
                      <option value="3">3 Hari</option>
                      <option value="7">7 Hari</option>
                      <option value="30">30 Hari</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-300 font-bold">Batas Penggunaan (Max Uses)</label>
                    <select
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none"
                    >
                      <option value="1">1 Kali Pakai (Sekali Pakai)</option>
                      <option value="5">5 Kali Pakai</option>
                      <option value="10">10 Kali Pakai</option>
                      <option value="0">Tanpa Batas</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-4 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 font-extrabold text-xs text-white rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Generate Invite Link
                  </button>
                </form>

                {/* Display Newly Created Invite Link */}
                {createdInviteUrl && (
                  <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-700 rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Link Undangan Berhasil Dibuat!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={createdInviteUrl}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-emerald-800 rounded-lg text-emerald-200 font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(createdInviteUrl, 'new_created')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {copiedInviteId === 'new_created' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedInviteId === 'new_created' ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Invite Links Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Daftar Link Undangan Aktif & Riwayat
                </h3>

                {invites.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Belum ada link undangan yang dibuat.
                  </div>
                ) : (
                  invites.map((inv) => {
                    const shareUrl = `${window.location.origin}/?invite=${inv.token}`;
                    return (
                      <div
                        key={inv.id}
                        className="p-4 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                              {inv.token}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                                inv.status === 'active'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                  : inv.status === 'expired'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {inv.status === 'active'
                                ? 'Aktif'
                                : inv.status === 'expired'
                                ? 'Kedaluwarsa'
                                : 'Habis Pakai'}
                            </span>

                            {/* Usage Count */}
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              Penggunaan: {inv.usedCount} / {inv.maxUses === 0 ? '∞' : inv.maxUses}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                            <span>
                              Kedaluwarsa:{' '}
                              {inv.expiresAt === 'never' || !inv.expiresAt
                                ? 'Selamanya (Sampai Web Hilang)'
                                : new Date(inv.expiresAt).toLocaleString('id-ID')}
                            </span>
                            {inv.usedByUsers.length > 0 && (
                              <span>
                                Didaftarkan oleh: <strong className="text-slate-700 dark:text-slate-300">{inv.usedByUsers.join(', ')}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => copyToClipboard(shareUrl, inv.id)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            {copiedInviteId === inv.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedInviteId === inv.id ? 'Tersalin' : 'Salin Link'}</span>
                          </button>

                          <button
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Cabut Invite Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>

      </div>

      {/* CREATE USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-black text-slate-900 dark:text-white text-base">Tambah User Baru</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addUserError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Username</label>
                <input
                  type="text"
                  placeholder="Contoh: budis"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Password Initial</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Role Pengguna</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-900 dark:text-white font-bold"
                >
                  <option value="user">User Biasa</option>
                  <option value="owner">Owner (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

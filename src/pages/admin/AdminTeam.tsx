import React, { useEffect, useState } from 'react';
import { supabase, isAdminUser } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { UserProfile } from '../../types';
import { Users, UserPlus, ShieldCheck, Trash2, Mail, Crown, X, Check, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const AdminTeam: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettings();
  const isMasterOwner = user?.email?.toLowerCase().trim() === 'mnage.faisalsheikh@gmail.com';

  const [admins, setAdmins] = useState<UserProfile[]>([
    {
      id: 'owner-admin',
      full_name: 'Store Owner',
      email: 'mnage.faisalsheikh@gmail.com',
      avatar_url: null,
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAdmins = async () => {
    try {
      let staffList: UserProfile[] = [
        {
          id: 'owner-admin',
          full_name: 'Store Owner',
          email: 'mnage.faisalsheikh@gmail.com',
          avatar_url: null,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ];

      // Load local authorized emails
      try {
        const localEmails: string[] = JSON.parse(localStorage.getItem('kintesi_authorized_admins') || '[]');
        localEmails.forEach((em) => {
          if (em.toLowerCase() !== 'mnage.faisalsheikh@gmail.com') {
            staffList.push({
              id: 'local-' + em,
              full_name: em.split('@')[0],
              email: em,
              avatar_url: null,
              role: 'admin',
              created_at: new Date().toISOString(),
            });
          }
        });
      } catch {}

      const { data } = await supabase.from('profiles').select('*').eq('role', 'admin');
      if (data && data.length > 0) {
        data.forEach((dbAdmin) => {
          if (!staffList.some((s) => s.email.toLowerCase() === dbAdmin.email.toLowerCase())) {
            staffList.push(dbAdmin);
          }
        });
      }

      setAdmins(staffList);
    } catch (err) {
      console.warn('Admins load note:', err);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) {
      toast.error('Please enter the user email address');
      return;
    }

    setLoading(true);
    const emailToGrant = newAdminEmail.trim().toLowerCase();

    // 1. Save to centralized store settings
    const existingAdmins = settings.authorizedAdmins || ['mnage.faisalsheikh@gmail.com'];
    if (!existingAdmins.map((e) => e.toLowerCase()).includes(emailToGrant)) {
      await updateSettings({ authorizedAdmins: [...existingAdmins, emailToGrant] });
    }

    // 2. Save to local storage fallback
    try {
      const existing: string[] = JSON.parse(localStorage.getItem('kintesi_authorized_admins') || '[]');
      if (!existing.map((e) => e.toLowerCase()).includes(emailToGrant)) {
        localStorage.setItem('kintesi_authorized_admins', JSON.stringify([...existing, emailToGrant]));
      }
    } catch {}

    // 3. Update in Supabase profiles if exists
    try {
      const { data: userRecord } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailToGrant)
        .single();

      if (userRecord) {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', userRecord.id);
      }
    } catch (err: any) {
      console.warn('Grant admin note:', err.message);
    }

    toast.success(`Admin access granted to ${emailToGrant}!`);
    setIsModalOpen(false);
    setNewAdminEmail('');
    setNewAdminName('');
    setLoading(false);
    loadAdmins();
  };

  const handleRevokeAdmin = async (admin: UserProfile) => {
    if (admin.email.toLowerCase() === 'mnage.faisalsheikh@gmail.com') {
      toast.error('Cannot remove store owner admin account');
      return;
    }

    if (!confirm(`Are you sure you want to revoke admin privileges from ${admin.email}?`)) return;

    const existingAdmins = settings.authorizedAdmins || ['mnage.faisalsheikh@gmail.com'];
    const updatedList = existingAdmins.filter((e) => e.toLowerCase() !== admin.email.toLowerCase());
    await updateSettings({ authorizedAdmins: updatedList });

    try {
      const existing: string[] = JSON.parse(localStorage.getItem('kintesi_authorized_admins') || '[]');
      const updated = existing.filter((e) => e.toLowerCase() !== admin.email.toLowerCase());
      localStorage.setItem('kintesi_authorized_admins', JSON.stringify(updated));
    } catch {}

    try {
      await supabase.from('profiles').update({ role: 'customer' }).eq('email', admin.email);
    } catch {}

    setAdmins(admins.filter((a) => a.email.toLowerCase() !== admin.email.toLowerCase()));
    toast.info(`Admin access revoked for ${admin.email}`);
  };

  if (!isMasterOwner) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Owner Authorization Required</h2>
          <p className="text-xs text-gray-400 leading-relaxed">
            Only the Store Owner (<b>mnage.faisalsheikh@gmail.com</b>) has permission to manage and authorize staff admins.
          </p>
          <Link
            to="/admin"
            className="inline-block py-2.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" />
            <span>Admin & Staff Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Authorize team members to manage products, orders, and receive payments
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Admin / Staff</span>
        </button>
      </div>

      {/* Admins Table */}
      <div className="bg-gray-800/80 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/60 border-b border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Admin Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Role & Privileges</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60 text-gray-200">
              {admins.map((adm) => {
                const isMaster = adm.email.toLowerCase() === 'mnage.faisalsheikh@gmail.com';
                return (
                  <tr key={adm.id || adm.email} className="hover:bg-gray-700/40 transition">
                    <td className="p-4 font-bold text-white flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                        {adm.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p>{adm.full_name || 'Admin User'}</p>
                        {isMaster && <span className="text-[10px] text-rose-300 font-semibold">Store Owner</span>}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-gray-300">{adm.email}</td>
                    <td className="p-4">
                      {isMaster ? (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-max">
                          <Crown className="w-3 h-3 text-amber-400" /> Master Super Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Staff Admin
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!isMaster ? (
                        <button
                          onClick={() => handleRevokeAdmin(adm)}
                          className="p-2 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded-lg transition"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-medium">Protected Owner</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-slide-up text-white">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-black">Authorize New Admin</h3>
                <p className="text-xs text-gray-400 mt-0.5">Grant dashboard and product management access</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-800 text-gray-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Admin Full Name</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Asif Mahmud"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase mb-1">Admin Email Address (Google / Login Mail) *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="newadmin@gmail.com"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] leading-relaxed">
                When this user signs in with Google or Email, they will immediately have full access to add products, change merchant payment numbers, and manage orders.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Authorizing...' : 'Grant Admin Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

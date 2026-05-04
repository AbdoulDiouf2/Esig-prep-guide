import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Shield, Save, AlertCircle, CheckCircle, Plus, Trash2, X, Lock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS } from '../../types/permissions';
import type { Permission, RoleDoc } from '../../types/permissions';

const SYSTEM_ROLES = ['user', 'editor', 'admin', 'superAdmin'] as const;
type SystemRoleId = typeof SYSTEM_ROLES[number];

const SYSTEM_ROLE_LABELS: Record<SystemRoleId, string> = {
  user: 'Utilisateur',
  editor: 'Éditeur',
  admin: 'Administrateur',
  superAdmin: 'Super Admin',
};

const ROLE_COLORS: Record<string, string> = {
  user: 'bg-gray-100 text-gray-700',
  editor: 'bg-green-100 text-green-700',
  admin: 'bg-blue-100 text-blue-800',
  superAdmin: 'bg-purple-100 text-purple-800',
};

interface RoleEntry {
  id: string;
  label: string;
  permissions: Set<Permission>;
  isSystem: boolean;
}

interface CreateRoleModal {
  open: boolean;
  name: string;
  templateId: string;
  draftPerms: Set<Permission>;
}

const EMPTY_MODAL: CreateRoleModal = {
  open: false, name: '', templateId: 'user',
  draftPerms: new Set(DEFAULT_ROLE_PERMISSIONS['user']),
};

export default function AdminRoleManager() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [modal, setModal] = useState<CreateRoleModal>(EMPTY_MODAL);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const systemEntries: RoleEntry[] = await Promise.all(
        SYSTEM_ROLES.map(async (roleId) => {
          const snap = await getDoc(doc(db, 'roles', roleId));
          const perms = snap.exists()
            ? new Set<Permission>((snap.data() as RoleDoc).permissions)
            : new Set<Permission>(DEFAULT_ROLE_PERMISSIONS[roleId] ?? []);
          return { id: roleId, label: SYSTEM_ROLE_LABELS[roleId], permissions: perms, isSystem: true };
        })
      );
      const allSnap = await getDocs(collection(db, 'roles'));
      const customEntries: RoleEntry[] = [];
      allSnap.forEach(d => {
        if (!SYSTEM_ROLES.includes(d.id as SystemRoleId)) {
          const data = d.data() as RoleDoc & { label?: string };
          customEntries.push({
            id: d.id,
            label: data.label || d.id,
            permissions: new Set<Permission>(data.permissions ?? []),
            isSystem: false,
          });
        }
      });
      const all = [...systemEntries, ...customEntries];
      setRoles(all);
      if (!selectedId) setSelectedId(all[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  const selected = roles.find(r => r.id === selectedId) ?? null;
  const isLocked = selected?.id === 'superAdmin';

  const toggle = (perm: Permission) => {
    if (!selected || isLocked) return;
    setRoles(prev => prev.map(r => {
      if (r.id !== selected.id) return r;
      const next = new Set(r.permissions);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return { ...r, permissions: next };
    }));
  };

  const save = async () => {
    if (!selected || isLocked) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'roles', selected.id), {
        permissions: Array.from(selected.permissions),
        ...(selected.isSystem ? {} : { label: selected.label }),
      });
      showToast('success', `Permissions "${selected.label}" sauvegardées`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!selected || selected.isSystem) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'roles', selected.id));
      setRoles(prev => prev.filter(r => r.id !== selected.id));
      setSelectedId(roles[0]?.id ?? null);
      setConfirmDelete(false);
      showToast('success', `Rôle "${selected.label}" supprimé`);
    } catch {
      showToast('error', 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const createRole = async () => {
    const id = modal.name.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) return;
    if (roles.find(r => r.id === id)) { showToast('error', `Le rôle "${id}" existe déjà`); return; }
    const perms = new Set(modal.draftPerms);
    try {
      await setDoc(doc(db, 'roles', id), { permissions: Array.from(perms), label: modal.name.trim() });
      const entry: RoleEntry = { id, label: modal.name.trim(), permissions: perms, isSystem: false };
      setRoles(prev => [...prev, entry]);
      setSelectedId(id);
      setModal(EMPTY_MODAL);
      showToast('success', `Rôle "${modal.name.trim()}" créé`);
    } catch {
      showToast('error', 'Erreur lors de la création');
    }
  };

  const toggleDraft = (perm: Permission) => {
    setModal(m => {
      const next = new Set(m.draftPerms);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return { ...m, draftPerms: next };
    });
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-6 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="flex items-center text-blue-200 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-300" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Gestion des rôles</h1>
              <p className="text-blue-200 text-xs">{roles.length} rôles · {roles.filter(r => !r.isSystem).length} custom</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setModal({ open: true, name: '', templateId: 'user', draftPerms: new Set(roles.find(r => r.id === 'user')?.permissions ?? DEFAULT_ROLE_PERMISSIONS['user']) })}
          className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow"
        >
          <Plus className="w-4 h-4" /> Nouveau rôle
        </button>
      </div>

      {/* Body — sidebar + detail */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôles système</p>
          </div>
          {roles.filter(r => r.isSystem).map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedId(role.id)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-50 ${
                selectedId === role.id ? 'bg-blue-50 border-l-4 border-l-blue-900' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_COLORS[role.id]?.split(' ')[0] ?? 'bg-gray-300'}`} />
                <span className="text-sm font-medium text-gray-800 truncate">{role.label}</span>
                {role.id === 'superAdmin' && <Lock className="w-3 h-3 text-purple-400 flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-400">{role.permissions.size}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-300 ${selectedId === role.id ? 'text-blue-600' : ''}`} />
              </div>
            </button>
          ))}

          {roles.some(r => !r.isSystem) && (
            <>
              <div className="p-3 border-b border-gray-100 mt-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôles custom</p>
              </div>
              {roles.filter(r => !r.isSystem).map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedId(role.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-gray-50 ${
                    selectedId === role.id ? 'bg-blue-50 border-l-4 border-l-blue-900' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 truncate">{role.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-400">{role.permissions.size}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-300 ${selectedId === role.id ? 'text-blue-600' : ''}`} />
                  </div>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Detail panel */}
        {selected ? (
          <main className="flex-1 overflow-y-auto p-6">
            {/* Role header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selected.label}</h2>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    selected.isSystem
                      ? (ROLE_COLORS[selected.id] ?? 'bg-blue-100 text-blue-700')
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selected.isSystem ? 'Système' : 'Custom'}
                  </span>
                  {isLocked && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                      <Lock className="w-3 h-3" /> Verrouillé
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {selected.permissions.size} permission{selected.permissions.size > 1 ? 's' : ''} sur {ALL_PERMISSIONS.length}
                  {selected.id !== 'superAdmin' && ' · Cliquez sur une permission pour la basculer'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!selected.isSystem && (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
                )}
                {!isLocked && (
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {!isLocked && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Couverture des permissions</span>
                  <span>{Math.round(selected.permissions.size / ALL_PERMISSIONS.length * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-900 rounded-full transition-all"
                    style={{ width: `${selected.permissions.size / ALL_PERMISSIONS.length * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Permissions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                const activeCount = perms.filter(p => selected.permissions.has(p)).length;
                return (
                  <div key={group} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">{group}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        activeCount === perms.length
                          ? 'bg-green-100 text-green-700'
                          : activeCount === 0
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {activeCount}/{perms.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map(perm => {
                        const active = selected.permissions.has(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => toggle(perm)}
                            disabled={isLocked}
                            title={perm}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              active
                                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                            } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {PERMISSION_LABELS[perm] ?? perm}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        ) : (
          <main className="flex-1 flex items-center justify-center text-gray-400">
            <p>Sélectionnez un rôle</p>
          </main>
        )}
      </div>

      {/* Modal création */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-900" /> Nouveau rôle
              </h2>
              <button onClick={() => setModal(EMPTY_MODAL)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* Left — nom + template */}
              <div className="w-64 flex-shrink-0 border-r border-gray-100 p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Nom du rôle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modal.name}
                    onChange={e => setModal(m => ({ ...m, name: e.target.value }))}
                    placeholder="ex: modérateur…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                    autoFocus
                  />
                  {modal.name.trim() && (
                    <p className="text-xs text-gray-400 mt-1">
                      ID : <span className="font-mono">{modal.name.trim().toLowerCase().replace(/\s+/g, '-')}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Template
                  </label>
                  <select
                    value={modal.templateId}
                    onChange={e => {
                      const tpl = roles.find(r => r.id === e.target.value);
                      setModal(m => ({ ...m, templateId: e.target.value, draftPerms: new Set(tpl?.permissions ?? []) }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    {roles.filter(r => r.id !== 'superAdmin').map(r => (
                      <option key={r.id} value={r.id}>
                        {r.label} — {r.permissions.size} perms
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400 mb-3">
                    <span className="font-semibold text-blue-900 text-sm">{modal.draftPerms.size}</span> / {ALL_PERMISSIONS.length} permissions sélectionnées
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-blue-900 rounded-full transition-all"
                      style={{ width: `${modal.draftPerms.size / ALL_PERMISSIONS.length * 100}%` }}
                    />
                  </div>
                  <button onClick={() => setModal(EMPTY_MODAL)} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-2">
                    Annuler
                  </button>
                  <button
                    onClick={createRole}
                    disabled={!modal.name.trim()}
                    className="w-full px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Créer le rôle
                  </button>
                </div>
              </div>

              {/* Right — permissions */}
              <div className="flex-1 overflow-y-auto p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Permissions</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                    const activeCount = perms.filter(p => modal.draftPerms.has(p)).length;
                    return (
                      <div key={group} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-gray-600">{group}</h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            activeCount === perms.length ? 'bg-green-100 text-green-700'
                            : activeCount === 0 ? 'bg-gray-200 text-gray-400'
                            : 'bg-blue-50 text-blue-700'
                          }`}>{activeCount}/{perms.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {perms.map(perm => {
                            const active = modal.draftPerms.has(perm);
                            return (
                              <button
                                key={perm}
                                type="button"
                                onClick={() => toggleDraft(perm)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  active
                                    ? 'bg-blue-900 text-white border-blue-900'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {PERMISSION_LABELS[perm] ?? perm}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Supprimer "{selected.label}" ?</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

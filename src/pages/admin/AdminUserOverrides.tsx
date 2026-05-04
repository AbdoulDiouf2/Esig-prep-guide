import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  ArrowLeft, UserCog, Search, Plus, Minus, Save,
  AlertCircle, CheckCircle, Shield, ShieldOff, ShieldCheck,
  User, X, ChevronRight, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PERMISSION_GROUPS, PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS } from '../../types/permissions';
import type { Permission, RoleDoc, UserOverrideDoc } from '../../types/permissions';

interface UserEntry {
  uid: string;
  displayName: string;
  email: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isEditor?: boolean;
}

interface FoundUser extends UserEntry {
  roleId: string;
  rolePerms: Set<Permission>;
  extraPerms: Set<Permission>;
  blockedPerms: Set<Permission>;
}

const getRoleId = (u: UserEntry): string => {
  if (u.isSuperAdmin) return 'superAdmin';
  if (u.isAdmin) return 'admin';
  if (u.isEditor) return 'editor';
  return 'user';
};

const ROLE_COLORS: Record<string, string> = {
  superAdmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  editor: 'bg-amber-100 text-amber-800',
  user: 'bg-zinc-100 text-zinc-600',
};

const ROLE_LABELS: Record<string, string> = {
  superAdmin: 'Super Admin',
  admin: 'Admin',
  editor: 'Éditeur',
  user: 'Utilisateur',
};

export default function AdminUserOverrides() {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FoundUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [usersWithOverrides, setUsersWithOverrides] = useState<Set<string>>(new Set());
  const [showOverrideList, setShowOverrideList] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      const list: UserEntry[] = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() } as UserEntry));
      setAllUsers(list);
    });
    getDocs(collection(db, 'userOverrides')).then(snap => {
      const ids = new Set<string>();
      snap.forEach(d => {
        const data = d.data() as UserOverrideDoc;
        if ((data.extraPermissions?.length ?? 0) > 0 || (data.blockedPermissions?.length ?? 0) > 0) {
          ids.add(d.id);
        }
      });
      setUsersWithOverrides(ids);
    });
  }, []);

  const filteredUsers = search.trim().length >= 2
    ? allUsers.filter(u => {
        const q = search.toLowerCase();
        return u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  const selectUser = async (user: UserEntry) => {
    if (selected?.uid === user.uid) return;
    setLoadingUser(true);
    setSelected(null);

    const roleId = getRoleId(user);
    const [roleSnap, overrideSnap] = await Promise.all([
      getDoc(doc(db, 'roles', roleId)),
      getDoc(doc(db, 'userOverrides', user.uid)),
    ]);

    const roleData = roleSnap.data() as RoleDoc | undefined;
    const rolePerms = new Set<Permission>(roleData?.permissions ?? DEFAULT_ROLE_PERMISSIONS[roleId] ?? []);
    const overrideData = overrideSnap.data() as UserOverrideDoc | undefined;
    const extraPerms = new Set<Permission>(overrideData?.extraPermissions ?? []);
    const blockedPerms = new Set<Permission>(overrideData?.blockedPermissions ?? []);

    setSelected({ ...user, roleId, rolePerms, extraPerms, blockedPerms });
    setLoadingUser(false);
  };

  const toggleExtra = (perm: Permission) => {
    if (!selected) return;
    const extra = new Set(selected.extraPerms);
    const blocked = new Set(selected.blockedPerms);
    if (blocked.has(perm)) {
      // annule le blocage
      blocked.delete(perm);
    } else if (extra.has(perm)) {
      extra.delete(perm);
    } else if (!selected.rolePerms.has(perm)) {
      extra.add(perm);
    }
    setSelected({ ...selected, extraPerms: extra, blockedPerms: blocked });
  };

  const toggleBlocked = (perm: Permission) => {
    if (!selected) return;
    const extra = new Set(selected.extraPerms);
    const blocked = new Set(selected.blockedPerms);
    if (blocked.has(perm)) {
      // annule le blocage
      blocked.delete(perm);
    } else if (extra.has(perm)) {
      extra.delete(perm);
    } else {
      blocked.add(perm);
    }
    setSelected({ ...selected, extraPerms: extra, blockedPerms: blocked });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const isEmpty = selected.extraPerms.size === 0 && selected.blockedPerms.size === 0;
      if (isEmpty) {
        await deleteDoc(doc(db, 'userOverrides', selected.uid));
      } else {
        await setDoc(doc(db, 'userOverrides', selected.uid), {
          extraPermissions: Array.from(selected.extraPerms),
          blockedPermissions: Array.from(selected.blockedPerms),
        } as UserOverrideDoc);
      }
      setUsersWithOverrides(prev => {
        const next = new Set(prev);
        if (!isEmpty) next.add(selected.uid);
        else next.delete(selected.uid);
        return next;
      });
      showToast('success', isEmpty
        ? `Exceptions supprimées — ${selected.displayName || selected.email} revient à son rôle par défaut`
        : `Exceptions sauvegardées pour ${selected.displayName || selected.email}`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getPermState = (perm: Permission): 'role' | 'extra' | 'blocked' | 'none' => {
    if (!selected) return 'none';
    if (selected.blockedPerms.has(perm)) return 'blocked';
    if (selected.extraPerms.has(perm)) return 'extra';
    if (selected.rolePerms.has(perm)) return 'role';
    return 'none';
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const effectiveCount = selected
    ? Array.from({ length: 0 }, () => null).length +
      [...selected.rolePerms, ...selected.extraPerms].filter(p => !selected.blockedPerms.has(p)).length
    : 0;

  const totalPerms = Object.values(PERMISSION_GROUPS).flat().length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-blue-200 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin
        </button>
        <span className="text-blue-600">/</span>
        <div className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-blue-200" />
          <span className="font-semibold text-lg">Exceptions par utilisateur</span>
        </div>
      </div>

      {/* Body: sidebar + detail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col">
          {/* Users with existing overrides — top section */}
          {usersWithOverrides.size > 0 && (
            <div className="border-b border-zinc-200 flex-shrink-0">
              <button
                onClick={() => setShowOverrideList(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  {usersWithOverrides.size} utilisateur{usersWithOverrides.size > 1 ? 's' : ''} avec exceptions
                </span>
                {showOverrideList ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {showOverrideList && (
                <div className="max-h-48 overflow-y-auto border-t border-zinc-100">
                  {allUsers.filter(u => usersWithOverrides.has(u.uid)).map(u => {
                    const roleId = getRoleId(u);
                    const isSelected = selected?.uid === u.uid;
                    return (
                      <button
                        key={u.uid}
                        onClick={() => selectUser(u)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-l-2 ${
                          isSelected ? 'bg-blue-50 border-l-blue-900' : 'border-l-transparent hover:bg-zinc-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected ? 'bg-blue-900 text-white' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(u.displayName || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-zinc-900 truncate">{u.displayName || '—'}</p>
                          <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${ROLE_COLORS[roleId]}`}>
                          {ROLE_LABELS[roleId]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="p-4 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur…"
                className="w-full pl-9 pr-8 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* User list */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1">
            {search.trim().length < 2 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2 px-4 text-center">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">Tapez au moins 2 caractères pour rechercher</p>
              </div>
            )}
            {search.trim().length >= 2 && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                <User className="w-8 h-8 opacity-30" />
                <p className="text-sm">Aucun résultat</p>
              </div>
            )}
            {filteredUsers.map(u => {
              const roleId = getRoleId(u);
              const hasOverride = usersWithOverrides.has(u.uid);
              const isSelected = selected?.uid === u.uid;
              const initials = (u.displayName || u.email || '?')[0].toUpperCase();

              return (
                <button
                  key={u.uid}
                  onClick={() => selectUser(u)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    isSelected
                      ? 'bg-blue-50 border-l-blue-900'
                      : 'border-l-transparent hover:bg-zinc-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isSelected ? 'bg-blue-900 text-white' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{u.displayName || '—'}</p>
                    <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[roleId]}`}>
                      {ROLE_LABELS[roleId]}
                    </span>
                    {hasOverride && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title="A des exceptions" />
                    )}
                  </div>
                  {isSelected && <ChevronRight className="w-4 h-4 text-blue-900 flex-shrink-0" />}
                </button>
              );
            })}
            </div>

          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {!selected && !loadingUser && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
              <UserCog className="w-12 h-12 opacity-30" />
              <p className="text-sm">Sélectionnez un utilisateur pour gérer ses exceptions</p>
            </div>
          )}

          {loadingUser && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900" />
            </div>
          )}

          {selected && !loadingUser && (
            <div className="p-6 max-w-4xl">
              {/* User header */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-lg">
                      {(selected.displayName || selected.email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-900 text-lg">{selected.displayName || '—'}</p>
                      <p className="text-sm text-zinc-500">{selected.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[selected.roleId]}`}>
                          {ROLE_LABELS[selected.roleId]}
                        </span>
                        {selected.extraPerms.size > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            +{selected.extraPerms.size} ajoutée{selected.extraPerms.size > 1 ? 's' : ''}
                          </span>
                        )}
                        {selected.blockedPerms.size > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            −{selected.blockedPerms.size} bloquée{selected.blockedPerms.size > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Progress */}
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-zinc-400 mb-1">Permissions effectives</p>
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${(effectiveCount / totalPerms) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-zinc-700">{effectiveCount}/{totalPerms}</span>
                      </div>
                    </div>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mb-5 px-1 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  Permission du rôle
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  Ajoutée (+)
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldOff className="w-3.5 h-3.5 text-red-500" />
                  Bloquée (−)
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-300" />
                  Sans accès
                </span>
                <span className="ml-auto text-zinc-400">Cliquez <Plus className="w-3 h-3 inline" /> pour ajouter · <Minus className="w-3 h-3 inline" /> pour bloquer</span>
              </div>

              {/* Permission groups — 2-col grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                  const activeInGroup = perms.filter(p => {
                    const s = getPermState(p);
                    return s === 'role' || s === 'extra';
                  }).length;
                  const blockedInGroup = perms.filter(p => getPermState(p) === 'blocked').length;

                  return (
                    <div key={group} className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{group}</h3>
                        <div className="flex items-center gap-1.5">
                          {blockedInGroup > 0 && (
                            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                              −{blockedInGroup}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            activeInGroup === perms.length
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : activeInGroup === 0
                                ? 'bg-zinc-50 text-zinc-400 border border-zinc-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {activeInGroup}/{perms.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {perms.map(perm => {
                          const state = getPermState(perm);

                          const rowBg: Record<string, string> = {
                            role: 'bg-blue-50 border-blue-200',
                            extra: 'bg-green-50 border-green-300',
                            blocked: 'bg-red-50 border-red-300 opacity-60',
                            none: 'bg-zinc-50 border-zinc-200',
                          };
                          const labelColor: Record<string, string> = {
                            role: 'text-blue-800',
                            extra: 'text-green-800 font-semibold',
                            blocked: 'text-red-700 line-through',
                            none: 'text-zinc-400',
                          };

                          return (
                            <div key={perm} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${rowBg[state]}`}>
                              <div className="flex items-center gap-2">
                                {state === 'role' && <Shield className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                                {state === 'extra' && <ShieldCheck className="w-3 h-3 text-green-500 flex-shrink-0" />}
                                {state === 'blocked' && <ShieldOff className="w-3 h-3 text-red-400 flex-shrink-0" />}
                                {state === 'none' && <User className="w-3 h-3 text-zinc-300 flex-shrink-0" />}
                                <span className={labelColor[state]}>{PERMISSION_LABELS[perm] ?? perm}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleExtra(perm)}
                                  title={state === 'role' ? 'Déjà inclus dans le rôle' : 'Ajouter'}
                                  disabled={state === 'role'}
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                    state === 'role'
                                      ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                      : state === 'extra'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white border border-zinc-200 text-zinc-400 hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => toggleBlocked(perm)}
                                  title="Bloquer"
                                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                                    state === 'blocked'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-white border border-zinc-200 text-zinc-400 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                  }`}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

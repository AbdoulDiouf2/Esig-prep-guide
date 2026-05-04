import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, UserCog, Search, Plus, Minus, Save, AlertCircle, CheckCircle } from 'lucide-react';
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

export default function AdminUserOverrides() {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<UserEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [found, setFound] = useState<FoundUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      const list: UserEntry[] = [];
      snap.forEach(d => list.push({ uid: d.id, ...d.data() } as UserEntry));
      setAllUsers(list);
    });

    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = search.toLowerCase();
    const filtered = allUsers
      .filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q)
      )
      .slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [search, allUsers]);

  const selectUser = async (user: UserEntry) => {
    setShowSuggestions(false);
    setSearch(user.displayName || user.email);
    setLoadingUser(true);

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

    setFound({ ...user, roleId, rolePerms, extraPerms, blockedPerms });
    setLoadingUser(false);
  };

  const toggleExtra = (perm: Permission) => {
    if (!found) return;
    const extra = new Set(found.extraPerms);
    const blocked = new Set(found.blockedPerms);
    if (extra.has(perm)) { extra.delete(perm); }
    else { extra.add(perm); blocked.delete(perm); }
    setFound({ ...found, extraPerms: extra, blockedPerms: blocked });
  };

  const toggleBlocked = (perm: Permission) => {
    if (!found) return;
    const extra = new Set(found.extraPerms);
    const blocked = new Set(found.blockedPerms);
    if (blocked.has(perm)) { blocked.delete(perm); }
    else { blocked.add(perm); extra.delete(perm); }
    setFound({ ...found, extraPerms: extra, blockedPerms: blocked });
  };

  const save = async () => {
    if (!found) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'userOverrides', found.uid), {
        extraPermissions: Array.from(found.extraPerms),
        blockedPermissions: Array.from(found.blockedPerms),
      } as UserOverrideDoc);
      showToast('success', `Exceptions sauvegardées pour ${found.displayName || found.email}`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getPermState = (perm: Permission): 'role' | 'extra' | 'blocked' | 'none' => {
    if (!found) return 'none';
    if (found.blockedPerms.has(perm)) return 'blocked';
    if (found.extraPerms.has(perm)) return 'extra';
    if (found.rolePerms.has(perm)) return 'role';
    return 'none';
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour admin
          </button>
          <div className="flex items-center gap-3">
            <UserCog className="w-6 h-6 text-blue-200" />
            <div>
              <h1 className="text-2xl font-bold">Exceptions par utilisateur</h1>
              <p className="text-blue-100 text-sm mt-0.5">Ajoutez ou bloquez des permissions pour un utilisateur spécifique</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Recherche avec suggestions */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher un utilisateur
          </label>
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setFound(null); }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Nom ou email de l'utilisateur..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {showSuggestions && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                {suggestions.map(u => (
                  <li key={u.uid}>
                    <button
                      onMouseDown={e => { e.preventDefault(); selectUser(u); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-semibold text-sm flex-shrink-0">
                        {(u.displayName || u.email)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.displayName || '—'}</p>
                        <p className="text-xs text-gray-500">{u.email} · {getRoleId(u)}</p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {loadingUser && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-900" />
          </div>
        )}

        {found && !loadingUser && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-semibold">
                  {(found.displayName || found.email)?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{found.displayName || '—'}</p>
                  <p className="text-sm text-gray-500">{found.email} · rôle : <span className="font-medium text-blue-900">{found.roleId}</span></p>
                </div>
              </div>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap gap-4 mb-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" /> Permission du rôle</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block" /> Permission ajoutée (+)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" /> Permission bloquée (−)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border border-gray-200 inline-block" /> Sans accès</span>
              <span className="text-gray-400 ml-auto">Clic (+) pour ajouter · Clic (−) pour bloquer</span>
            </div>

            <div className="space-y-5">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                <div key={group}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map(perm => {
                      const state = getPermState(perm);
                      const colors: Record<string, string> = {
                        role: 'bg-blue-50 text-blue-800 border-blue-300',
                        extra: 'bg-green-50 text-green-800 border-green-400',
                        blocked: 'bg-red-50 text-red-700 border-red-400 line-through',
                        none: 'bg-white text-gray-400 border-gray-200',
                      };
                      return (
                        <div key={perm} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border ${colors[state]}`}>
                          <span>{PERMISSION_LABELS[perm] ?? perm}</span>
                          <button
                            onClick={() => toggleExtra(perm)}
                            title="Ajouter en extra"
                            className={`rounded p-0.5 transition-colors ${state === 'extra' ? 'bg-green-200 text-green-800' : 'hover:bg-gray-100 text-gray-400'}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => toggleBlocked(perm)}
                            title="Bloquer"
                            className={`rounded p-0.5 transition-colors ${state === 'blocked' ? 'bg-red-200 text-red-700' : 'hover:bg-gray-100 text-gray-400'}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft, Shield, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ALL_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, DEFAULT_ROLE_PERMISSIONS } from '../../types/permissions';
import type { Permission, RoleDoc } from '../../types/permissions';

const ROLES = ['user', 'editor', 'admin', 'superAdmin'] as const;
type RoleId = typeof ROLES[number];

const ROLE_LABELS: Record<RoleId, string> = {
  user: 'Utilisateur',
  editor: 'Éditeur',
  admin: 'Administrateur',
  superAdmin: 'Super Admin',
};

export default function AdminRoleManager() {
  const navigate = useNavigate();
  const [rolePerms, setRolePerms] = useState<Record<RoleId, Set<Permission>>>({
    user: new Set(),
    editor: new Set(),
    admin: new Set(),
    superAdmin: new Set(ALL_PERMISSIONS),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<RoleId | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const fetched: Record<string, Set<Permission>> = {};
      await Promise.all(
        ROLES.map(async (role) => {
          const snap = await getDoc(doc(db, 'roles', role));
          if (snap.exists()) {
            const data = snap.data() as RoleDoc;
            fetched[role] = new Set(data.permissions);
          } else {
            fetched[role] = new Set(DEFAULT_ROLE_PERMISSIONS[role] ?? []);
          }
        })
      );
      setRolePerms(fetched as Record<RoleId, Set<Permission>>);
      setLoading(false);
    };
    load();
  }, []);

  const toggle = (role: RoleId, perm: Permission) => {
    setRolePerms(prev => {
      const next = new Set(prev[role]);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return { ...prev, [role]: next };
    });
  };

  const save = async (role: RoleId) => {
    setSaving(role);
    try {
      await setDoc(doc(db, 'roles', role), { permissions: Array.from(rolePerms[role]) });
      showToast('success', `Permissions de ${ROLE_LABELS[role]} sauvegardées`);
    } catch {
      showToast('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(null);
    }
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
            <Shield className="w-6 h-6 text-blue-200" />
            <div>
              <h1 className="text-2xl font-bold">Gestion des rôles</h1>
              <p className="text-blue-100 text-sm mt-0.5">Configurez les permissions pour chaque rôle</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          {ROLES.map(role => (
            <div key={role} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-800">{ROLE_LABELS[role]}</h2>
                <button
                  onClick={() => save(role)}
                  disabled={saving === role}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving === role ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</h3>
                    <div className="flex flex-wrap gap-2">
                      {perms.map(perm => {
                        const active = rolePerms[role].has(perm);
                        return (
                          <button
                            key={perm}
                            onClick={() => toggle(role, perm)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

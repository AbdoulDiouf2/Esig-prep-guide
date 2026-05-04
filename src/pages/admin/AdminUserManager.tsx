import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../hooks/usePermission';
import { ArrowLeft, Shield, UserMinus, UserPlus, AlertTriangle, Edit, X, ChevronDown, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PasswordModal from '../../components/PasswordModal';
import { logAdminActivity } from './adminActivityLog';
import {
  createInvitation,
  getInvitations,
  revokeInvitation,
  Invitation,
} from '../../services/invitationService';
import { NotificationService } from '../../services/NotificationService';

// Typage strict de la réponse REST Firebase Auth
export interface FirebaseAuthUser {
  localId: string;
  email: string;
  displayName?: string;
  emailVerified?: boolean;
  photoUrl?: string;
  [key: string]: unknown;
}
interface FirebaseAuthBatchGetResponse {
  users?: FirebaseAuthUser[];
  nextPageToken?: string;
}
// Fonction utilitaire pour récupérer tous les utilisateurs Firebase Auth via REST API
async function fetchAllFirebaseAuthUsers(apiKey: string): Promise<FirebaseAuthUser[]> {
  let users: FirebaseAuthUser[] = [];
  let nextPageToken = undefined;
  do {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${process.env.REACT_APP_FIREBASE_PROJECT_ID}/accounts:batchGet?key=${apiKey}` + (nextPageToken ? `&nextPageToken=${nextPageToken}` : ''), {
      method: 'GET',
    });
    const data: FirebaseAuthBatchGetResponse = await res.json();
    if (data && data.users) users = users.concat(data.users);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return users;
}

// Type pour les timestamps Firestore
interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isEditor?: boolean;
  isDirector?: boolean;
  isStaff?: boolean;
  emailVerified: boolean;
  photoURL?: string;
  yearPromo?: number;     // Année de promotion (année de sortie de prépa)
  status?: string;        // Statut de l'utilisateur (actif, suspendu, etc.)
  createdAt?: string | FirestoreTimestamp | number | Date;  // Date de création du profil (plusieurs formats possibles)
  lastLogin?: string | FirestoreTimestamp | number | Date;
  lastActive?: FirestoreTimestamp | Date;
}

const AdminUserManager: React.FC = () => {
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  useEffect(() => {
    const close = () => setOpenActionMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{uid: string, action: 'toggleAdmin' | 'toggleEditor' | 'toggleDirector' | 'toggleStaff'} | null>(null);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [alumniYearPromoMap, setAlumniYearPromoMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUsers, setAuthUsers] = useState<FirebaseAuthUser[]>([]);
  const [loadingAuthUsers, setLoadingAuthUsers] = useState(false);
  const [missingProfiles, setMissingProfiles] = useState<FirebaseAuthUser[]>([]);
  const { currentUser } = useAuth();
  const canManageUsers = usePermission('users.manage');
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || '';
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('tous');
  const [statusFilter, setStatusFilter] = useState<'tous' | 'esigelec' | 'cps' | 'alumni' | 'administration' | 'autres'>('tous');
  const [yearPromoFilter, setYearPromoFilter] = useState<string>('');

  // Édition inline de l'année de promo
  const [editingPromoUid, setEditingPromoUid] = useState<string | null>(null);
  const [editingPromoValue, setEditingPromoValue] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 15;

  // Invitation state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'editor' | 'director' | 'staff' | 'admin'>('user');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Extraction dynamique des rôles
  const getUserRoles = (user: UserDoc) => {
    const badges: Array<{label: string, color: string, icon?: any, isBold?: boolean}> = [];
    
    if (user.isSuperAdmin) badges.push({ label: 'SuperAdmin', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', isBold: true });
    if (user.isAdmin) badges.push({ label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: Shield });
    if (user.isEditor) badges.push({ label: 'Éditeur', color: 'bg-green-100 text-green-800', icon: Edit });
    if (user.isDirector) badges.push({ label: 'Directeur', color: 'bg-purple-100 text-purple-800', icon: Shield });
    if (user.isStaff) badges.push({ label: 'Staff', color: 'bg-amber-100 text-amber-800', icon: UserPlus });
    
    // Détection automatique des rôles personnalisés (champs commençant par 'is' à true)
    const standardRoleKeys = ['isAdmin', 'isSuperAdmin', 'isEditor', 'isDirector', 'isStaff', 'isOwner'];
    Object.entries(user).forEach(([key, value]) => {
      if (key.startsWith('is') && value === true && !standardRoleKeys.includes(key)) {
        // Formater le label : isTestRole -> TestRole
        const roleLabel = key.slice(2);
        badges.push({ label: roleLabel, color: 'bg-gray-100 text-gray-800' });
      }
    });
    
    return badges;
  };

  // Liste unique de tous les rôles présents dans la base pour le filtre
  const availableRoles = useMemo(() => {
    const rolesSet = new Set<string>(['admin', 'editor', 'director', 'staff', 'standard']);
    users.forEach(user => {
      Object.entries(user).forEach(([key, value]) => {
        if (key.startsWith('is') && value === true && !['isOwner', 'uid', 'emailVerified'].includes(key)) {
          rolesSet.add(key.slice(2).toLowerCase());
        }
      });
    });
    return Array.from(rolesSet).sort();
  }, [users]);

  const getEffectiveYearPromo = (user: UserDoc): number | undefined =>
    alumniYearPromoMap[user.uid] ?? user.yearPromo;

  const promoYears = useMemo(() => {
    const years = new Set(users.map(user => getEffectiveYearPromo(user)).filter(Boolean));
    return Array.from(years).sort((a, b) => (b ?? 0) - (a ?? 0)); // Sort descending
  }, [users, alumniYearPromoMap]);

  // Fonction fetchUsers accessible partout dans le composant
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const userList: UserDoc[] = [];
      usersSnap.forEach((docSnap) => {
        userList.push(docSnap.data() as UserDoc);
      });
      setUsers(userList);

      // alumni optionnel — peut échouer si pas la permission alumni.validate
      setAlumniYearPromoMap({});
      try {
        const alumniSnap = await getDocs(collection(db, 'alumni'));
        const map: Record<string, number> = {};
        alumniSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.uid && data.yearPromo) map[data.uid] = data.yearPromo;
        });
        setAlumniYearPromoMap(map);
      } catch {
        // pas la permission alumni — on ignore, la colonne promo sera vide
      }
    } catch {
      setError('Erreur lors du chargement des utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchInvitations = async () => {
    setInvitationsLoading(true);
    try {
      const list = await getInvitations();
      setInvitations(list);
    } catch {
      // ignore
    } finally {
      setInvitationsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setInviteError(null);
    setInviteSuccess(null);
    setInviteLoading(true);
    try {
      const token = await createInvitation(inviteEmail, inviteRole, currentUser.uid);
      const inviteUrl = `${window.location.origin}/#/accept-invitation/${token}`;
      const message = `Bonjour,

Vous avez été invité(e) à rejoindre la plateforme CPS Connect.

Pour créer votre compte, cliquez sur le lien ci-dessous ou copiez-le dans votre navigateur :

${inviteUrl}

Ce lien est valable pendant 7 jours. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

L'équipe CPS Connect`;

      await NotificationService.sendCustomEmail(
        inviteEmail,
        "Vous êtes invité(e) à rejoindre CPS Connect",
        message,
        undefined,
        false
      );
      setInviteSuccess(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('user');
      fetchInvitations();
    } catch (err: unknown) {
      setInviteError((err as Error).message || "Erreur lors de l'envoi de l'invitation.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    await revokeInvitation(id);
    fetchInvitations();
  };

  // Récupère les utilisateurs Auth qui n'ont pas de profil Firestore
  useEffect(() => {
    const fetchAuthUsers = async () => {
      setLoadingAuthUsers(true);
      try {
        if (!apiKey) return;
        const allAuthUsers = await fetchAllFirebaseAuthUsers(apiKey);
        setAuthUsers(allAuthUsers);
      } catch {
        // ignore
      } finally {
        setLoadingAuthUsers(false);
      }
    };
    fetchAuthUsers();
  }, [apiKey]);

  useEffect(() => {
    // Compare les uid
    if (authUsers.length && users.length) {
      const missing = authUsers.filter(au => !users.some(u => u.uid === au.localId));
      setMissingProfiles(missing);
    }
  }, [authUsers, users]);

  // Vérifier si l'utilisateur actuel est un super admin
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const userProfile = users.find(u => u.uid === currentUser.uid);
      setCurrentUserIsSuperAdmin(!!userProfile?.isSuperAdmin);
    }
  }, [currentUser, users]);

  const handleToggleAdmin = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleAdmin' });
    setModalError(null);
  };

  const handleSaveYearPromo = async (uid: string) => {
    const year = parseInt(editingPromoValue);
    if (isNaN(year) || year < 2000 || year > 2050) return;
    await updateDoc(doc(db, 'users', uid), { yearPromo: year, updatedAt: new Date() });
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, yearPromo: year } : u));
    setEditingPromoUid(null);
  };

  const handleToggleEditor = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleEditor' });
    setModalError(null);
  };

  const handleToggleDirector = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleDirector' });
    setModalError(null);
  };

  const handleToggleStaff = async (uid: string) => {
    setModalOpen(true);
    setPendingUser({ uid, action: 'toggleStaff' });
    setModalError(null);
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingUser) return;
    setModalLoading(true);
    setModalError(null);
    if (password !== import.meta.env.VITE_TOGGLE_PASSWORD) {
      setModalError('Mot de passe incorrect.');
      setModalLoading(false);
      return;
    }
    // Vérification super admin
    const targetUser = users.find(u => u.uid === pendingUser.uid);
    // Permettre à un super admin de modifier d'autres super admins
    if (targetUser?.isSuperAdmin && targetUser.uid !== currentUser?.uid && !currentUserIsSuperAdmin) {
      setModalError("Impossible de modifier le rôle d'un SuperAdmin.");
      setModalLoading(false);
      return;
    }
    try {
      if (pendingUser.action === 'toggleAdmin') {
        const newAdminStatus = !targetUser?.isAdmin;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isAdmin: newAdminStatus });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isAdmin: newAdminStatus } : user
          )
        );
        
        // Log de l'activité
        await logAdminActivity({
          type: newAdminStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: { 
            action: 'Changement de rôle administrateur',
            userId: pendingUser.uid,
            newStatus: newAdminStatus ? 'Administrateur' : 'Utilisateur standard'
          }
        });
        
      } else if (pendingUser.action === 'toggleEditor') {
        const newEditorStatus = !targetUser?.isEditor;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isEditor: newEditorStatus });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isEditor: newEditorStatus } : user
          )
        );
        
        // Log de l'activité
        await logAdminActivity({
          type: newEditorStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: {
            action: 'Changement de rôle éditeur',
            userId: pendingUser.uid,
            newStatus: newEditorStatus ? 'Éditeur' : 'Utilisateur standard'
          }
        });

      } else if (pendingUser.action === 'toggleDirector') {
        const newStatus = !targetUser?.isDirector;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isDirector: newStatus, isStaff: false });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isDirector: newStatus, isStaff: false } : user
          )
        );
        await logAdminActivity({
          type: newStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: {
            action: 'Changement de rôle directeur',
            userId: pendingUser.uid,
            newStatus: newStatus ? 'Directeur' : 'Utilisateur standard'
          }
        });

      } else if (pendingUser.action === 'toggleStaff') {
        const newStatus = !targetUser?.isStaff;
        await updateDoc(doc(db, 'users', pendingUser.uid), { isStaff: newStatus, isDirector: false });
        setUsers((prev) =>
          prev.map((user) =>
            user.uid === pendingUser.uid ? { ...user, isStaff: newStatus, isDirector: false } : user
          )
        );
        await logAdminActivity({
          type: newStatus ? 'Ajout' : 'Suppression',
          target: 'Utilisateur',
          targetId: pendingUser.uid,
          user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
          details: {
            action: 'Changement de rôle staff',
            userId: pendingUser.uid,
            newStatus: newStatus ? 'Staff' : 'Utilisateur standard'
          }
        });
      }
      setModalOpen(false);
      setPendingUser(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      setModalError('Erreur lors de la mise à jour du statut utilisateur.');
    } finally {
      setModalLoading(false);
    }
  };

  // Création d'un profil Firestore pour un utilisateur Auth
  const handleCreateFirestoreProfile = async (authUser: FirebaseAuthUser) => {
    try {
      await setDoc(doc(db, 'users', authUser.localId), {
        uid: authUser.localId,
        email: authUser.email,
        displayName: authUser.displayName || '',
        isAdmin: false,
        isEditor: false,
        emailVerified: authUser.emailVerified || false,
        photoURL: authUser.photoUrl || '',
        createdAt: new Date().toLocaleString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        }).replace(',', ' à'), // Format: "16 juin 2025 à 20:21:00 UTC"
      });
      
      // Log de l'activité
      await logAdminActivity({
        type: 'Ajout',
        target: 'Utilisateur',
        targetId: authUser.localId,
        user: (typeof currentUser === 'object' && currentUser?.displayName) ? currentUser.displayName : undefined,
        details: { 
          action: 'Création de profil Firestore',
          userId: authUser.localId,
          email: authUser.email
        }
      });
      
      fetchUsers();
    } catch (e) {
      console.error("Erreur lors de la création du profil Firestore:", e);
      alert("Erreur lors de la création du profil Firestore : " + (e as Error).message);
    }
  };

  // Fonction pour exporter les utilisateurs CPS au format CSV
  const exportCpsUsersToCsv = () => {
    // Filtrer les utilisateurs avec le statut 'cps'
    const cpsUsers = users.filter(user => user.status === 'cps');
    
    if (cpsUsers.length === 0) {
      alert("Aucun utilisateur avec le statut CPS trouvé à exporter.");
      return;
    }

    // En-têtes CSV
    const headers = [
      'ID',
      'Email',
      'Nom d\'affichage',
      'Administrateur',
      'Éditeur',
      'Email vérifié',
      'Date de création'
    ];

    // Données des utilisateurs
    const csvContent = [
      headers.join(','), // En-têtes en première ligne
      ...cpsUsers.map(user => {
        let createdAt = 'Inconnue';
        
        // Vérifier le type de createdAt
        if (user.createdAt) {
          if (typeof user.createdAt === 'object' && user.createdAt !== null) {
            // Si c'est un timestamp Firestore avec toDate()
            if ('toDate' in user.createdAt && typeof user.createdAt.toDate === 'function') {
              createdAt = user.createdAt.toDate().toISOString();
            } 
            // Si c'est un objet avec seconds (timestamp Firestore brut)
            else if ('seconds' in user.createdAt && typeof user.createdAt.seconds === 'number') {
              const timestamp = user.createdAt as FirestoreTimestamp;
              createdAt = new Date(timestamp.seconds * 1000).toISOString();
            }
          } 
          // Si c'est une chaîne ou un nombre
          else if (typeof user.createdAt === 'string' || typeof user.createdAt === 'number') {
            createdAt = new Date(user.createdAt).toISOString();
          }
        }
        
        return [
          `"${user.uid}"`,
          `"${user.email}"`,
          `"${user.displayName || ''}"`,
          `"${user.isAdmin ? 'Oui' : 'Non'}"`,
          `"${user.isEditor ? 'Oui' : 'Non'}"`,
          `"${user.emailVerified ? 'Oui' : 'Non'}"`,
          `"${createdAt}"`
        ].join(',');
      })
    ].join('\n');

    // Créer un objet Blob avec le contenu CSV
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_cps_${date}.csv`);
    link.style.visibility = 'hidden';
    
    // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour synchroniser le statut des utilisateurs existants
  const syncUserStatuses = async () => {
    if (!confirm('Voulez-vous synchroniser le statut de tous les utilisateurs existants basé sur leur année de promotion ?\n\nCela mettra à jour automatiquement :\n- Alumni : si année de promotion < année actuelle\n- CPS : si année de promotion entre année actuelle et année actuelle + 1\n- Future : si année de promotion > année actuelle + 1')) {
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      let updatedCount = 0;
      
      // Parcourir tous les utilisateurs
      for (const user of users) {
        const effectiveYearPromo = getEffectiveYearPromo(user);
        if (!effectiveYearPromo) continue; // Ignorer les utilisateurs sans année de promotion

        let newStatus: 'alumni' | 'cps' | 'future';

        if (effectiveYearPromo < currentYear) {
          newStatus = 'alumni';
        } else if (effectiveYearPromo >= currentYear && effectiveYearPromo <= currentYear + 1) {
          newStatus = 'cps';
        } else {
          newStatus = 'future';
        }
        
        // Mettre à jour seulement si le statut a changé
        if (user.status !== newStatus) {
          await updateDoc(doc(db, 'users', user.uid), {
            status: newStatus,
            updatedAt: new Date()
          });
          updatedCount++;
        }
      }
      
      alert(`✅ Synchronisation terminée !\n${updatedCount} utilisateur(s) mis à jour(s)`);
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      alert('❌ Erreur lors de la synchronisation des statuts');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4 flex items-center">
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center text-blue-100 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour admin
          </button>
          <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        {/* Statistiques des utilisateurs */}
        <div className="mb-6 bg-blue-50 px-4 py-3 rounded-lg shadow-sm border border-blue-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-800 text-lg">Statistiques des utilisateurs</h3>
            <span className="bg-blue-600 text-white py-1 px-4 rounded-full font-bold">
              {loading ? '...' : `Total: ${users.length}`}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* ESIGELEC */}
            <div className="flex justify-between items-center p-2 bg-blue-100 rounded border border-blue-200">
              <span className="text-sm font-medium">ESIGELEC</span>
              <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'esigelec').length}
              </span>
            </div>
            
            {/* CPS */}
            <div className="flex justify-between items-center p-2 bg-purple-100 rounded border border-purple-200">
              <span className="text-sm font-medium">CPS</span>
              <span className="bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'cps').length}
              </span>
            </div>
            
            {/* Alumni */}
            <div className="flex justify-between items-center p-2 bg-green-100 rounded border border-green-200">
              <span className="text-sm font-medium">Alumni</span>
              <span className="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.status === 'alumni').length}
              </span>
            </div>
            
            {/* Autres */}
            <div className="flex justify-between items-center p-2 bg-gray-100 rounded border border-gray-200">
              <span className="text-sm font-medium">Autres</span>
              <span className="bg-gray-600 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => (!user.status || user.status === 'autres') && !user.isDirector && !user.isStaff).length}
              </span>
            </div>

            {/* Administration */}
            <div className="flex justify-between items-center p-2 bg-slate-100 rounded border border-slate-200">
              <span className="text-sm font-medium">Admin / Staff</span>
              <span className="bg-slate-700 text-white px-2.5 py-0.5 rounded-full text-sm font-semibold">
                {loading ? '...' : users.filter(user => user.isDirector || user.isStaff).length}
              </span>
            </div>
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher par nom, email ou année de promo..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-1">
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par rôle</label>
            <select
              id="role-filter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value);
                setCurrentPage(1); // Réinitialiser la pagination
              }}
            >
              <option value="tous">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="editor">Éditeur</option>
              <option value="director">Directeur</option>
              <option value="staff">Staff</option>
              <option value="standard">Standard (Aucun rôle)</option>
              {availableRoles
                .filter(r => !['admin', 'editor', 'director', 'staff', 'standard', 'superadmin'].includes(r))
                .map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))
              }
            </select>
          </div>
          
          <div className="lg:col-span-1">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par statut</label>
            <select
              id="status-filter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1); // Réinitialiser la pagination
              }}
            >
              <option value="tous">Tous les statuts</option>
              <option value="esigelec">ESIGELEC</option>
              <option value="cps">CPS</option>
              <option value="alumni">Alumni</option>
              <option value="administration">Administration</option>
              <option value="autres">Autres</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label htmlFor="year-promo-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrer par promo prépa</label>
            <select
              id="year-promo-filter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={yearPromoFilter}
              onChange={e => {
                setYearPromoFilter(e.target.value);
                setCurrentPage(1); // Réinitialiser la pagination
              }}
            >
              <option value="">Toutes les promotions</option>
              {promoYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="lg:col-span-2 flex flex-col sm:flex-row gap-2 justify-end">
            {canManageUsers && (
              <button
                onClick={() => { setInviteModalOpen(true); setInviteError(null); setInviteSuccess(null); }}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <Mail className="mr-1.5 h-4 w-4" />
                Inviter un utilisateur
              </button>
            )}
            {canManageUsers && (
              <button
                onClick={syncUserStatuses}
                className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Synchro Statuts
              </button>
            )}
            <button
              onClick={exportCpsUsersToCsv}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter CPS
            </button>
          </div>
        </div>

        {/* Utilisateurs Auth sans profil Firestore */}
        {loadingAuthUsers ? (
          <div className="mb-6 flex items-center text-yellow-600"><AlertTriangle className="w-5 h-5 mr-2" /> Chargement des utilisateurs Firebase Auth...</div>
        ) : (
          missingProfiles.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="font-bold text-yellow-800 mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2" /> Utilisateurs sans profil Firestore</div>
              <ul className="mb-2 text-sm">
                {missingProfiles.map(u => (
                  <li key={u.localId} className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-gray-700">{u.email}</span>
                    {canManageUsers && <button onClick={() => handleCreateFirestoreProfile(u)} className="ml-2 px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700">Créer le profil Firestore</button>}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-yellow-700">Ces utilisateurs existent dans l’authentification Firebase mais n’ont pas encore de document dans la collection <b>users</b>.</div>
            </div>
          )
        )}

        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <p className="text-sm text-gray-500 mb-2">
              {(() => {
                const filteredUsers = users
                  .filter(user => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      user.displayName?.toLowerCase().includes(q) ||
                      user.email?.toLowerCase().includes(q) ||
                      getEffectiveYearPromo(user)?.toString().includes(q)
                    );
                  })
                  .filter(user => {
                    // Filtrage par rôle dynamique
                    if (roleFilter === 'tous') return true;
                    if (roleFilter === 'standard') {
                      const roles = getUserRoles(user);
                      return roles.length === 0;
                    }
                    
                    // Vérifier si l'utilisateur possède le rôle filtré
                    const roleKey = `is${roleFilter.charAt(0).toUpperCase()}${roleFilter.slice(1)}`;
                    return (user as any)[roleKey] === true || 
                           (roleFilter === 'admin' && user.isAdmin) ||
                           (roleFilter === 'editor' && user.isEditor) ||
                           (roleFilter === 'director' && user.isDirector) ||
                           (roleFilter === 'staff' && user.isStaff) ||
                           (roleFilter === 'superadmin' && user.isSuperAdmin);
                  })
                  .filter(user => {
                    // Filtrage par statut
                    if (statusFilter === 'tous') return true;
                    if (statusFilter === 'administration') return !!(user.isDirector || user.isStaff);
                    if (statusFilter === 'autres') return (!user.status || user.status === 'autres') && !user.isDirector && !user.isStaff;
                    return user.status === statusFilter;
                  })
                  .filter(user => {
                    // Filtrage par année de promotion
                    if (!yearPromoFilter) return true;
                    return getEffectiveYearPromo(user)?.toString() === yearPromoFilter;
                  });

                return `Affichage de ${filteredUsers.length ? Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length) : 0} à ${Math.min(currentPage * usersPerPage, filteredUsers.length)} sur ${filteredUsers.length} utilisateurs${searchQuery || roleFilter !== 'tous' || statusFilter !== 'tous' || yearPromoFilter ? ' (filtrés)' : ''}`;
              })()}
            </p>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promo prépa</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date de création</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière activité</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users
                  .sort((a, b) => {
                    const getLastLoginTs = (user: UserDoc): number => {
                      if (!user.lastLogin) return 0;
                      if (user.lastLogin && typeof user.lastLogin === 'object' && 'toDate' in user.lastLogin && typeof (user.lastLogin as any).toDate === 'function')
                        return (user.lastLogin as any).toDate().getTime();
                      if (typeof user.lastLogin === 'object' && 'seconds' in user.lastLogin)
                        return (user.lastLogin as FirestoreTimestamp).seconds * 1000;
                      if (typeof user.lastLogin === 'number') return user.lastLogin;
                      if (typeof user.lastLogin === 'string') { const d = new Date(user.lastLogin); return isNaN(d.getTime()) ? 0 : d.getTime(); }
                      if (user.lastLogin instanceof Date) return user.lastLogin.getTime();
                      return 0;
                    };
                    const getLastActiveTs = (user: UserDoc): number => {
                      if (!user.lastActive) return 0;
                      if (user.lastActive && typeof user.lastActive === 'object' && 'toDate' in user.lastActive && typeof (user.lastActive as any).toDate === 'function')
                        return (user.lastActive as any).toDate().getTime();
                      if (typeof user.lastActive === 'object' && 'seconds' in user.lastActive)
                        return (user.lastActive as FirestoreTimestamp).seconds * 1000;
                      if (user.lastActive instanceof Date) return user.lastActive.getTime();
                      return 0;
                    };
                    // Tri par max(lastActive, lastLogin) décroissant
                    const tsA = Math.max(getLastActiveTs(a), getLastLoginTs(a));
                    const tsB = Math.max(getLastActiveTs(b), getLastLoginTs(b));
                    return tsB - tsA;
                  })
                  .filter(user => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      user.displayName?.toLowerCase().includes(q) ||
                      user.email?.toLowerCase().includes(q) ||
                      getEffectiveYearPromo(user)?.toString().includes(q)
                    );
                  })
                  .filter(user => {
                    // Filtrage par rôle dynamique
                    if (roleFilter === 'tous') return true;
                    if (roleFilter === 'standard') {
                      const roles = getUserRoles(user);
                      return roles.length === 0;
                    }
                    
                    // Vérifier si l'utilisateur possède le rôle filtré
                    const roleKey = `is${roleFilter.charAt(0).toUpperCase()}${roleFilter.slice(1)}`;
                    return (user as any)[roleKey] === true || 
                           (roleFilter === 'admin' && user.isAdmin) ||
                           (roleFilter === 'editor' && user.isEditor) ||
                           (roleFilter === 'director' && user.isDirector) ||
                           (roleFilter === 'staff' && user.isStaff) ||
                           (roleFilter === 'superadmin' && user.isSuperAdmin);
                  })
                  .filter(user => {
                    // Filtrage par statut
                    if (statusFilter === 'tous') return true;
                    if (statusFilter === 'administration') return !!(user.isDirector || user.isStaff);
                    if (statusFilter === 'autres') return (!user.status || user.status === 'autres') && !user.isDirector && !user.isStaff;
                    return user.status === statusFilter;
                  })
                  .filter(user => {
                    // Filtrage par année de promotion
                    if (!yearPromoFilter) return true;
                    return getEffectiveYearPromo(user)?.toString() === yearPromoFilter;
                  })
                  .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                  .map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-4 py-2 flex items-center cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/admin/users/${user.uid}`)}>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || user.email} className="w-8 h-8 rounded-full mr-2 object-cover bg-gray-200" />
                      ) : (
                        <span className="w-8 h-8 rounded-full mr-2 bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a8.963 8.963 0 01-6.879-3.196z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </span>
                      )}
                      {user.displayName || user.email}
                      {user.isSuperAdmin && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">SuperAdmin</span>
                      )}
                      {user.uid === currentUser?.uid && (
                        <span className="ml-2 text-xs text-blue-600">(Moi)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {editingPromoUid === user.uid ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={2000}
                            max={2050}
                            value={editingPromoValue}
                            onChange={e => setEditingPromoValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveYearPromo(user.uid);
                              if (e.key === 'Escape') setEditingPromoUid(null);
                            }}
                            autoFocus
                            className="w-20 border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button onClick={() => handleSaveYearPromo(user.uid)} className="text-green-600 hover:text-green-800 text-xs font-medium">✓</button>
                          <button onClick={() => setEditingPromoUid(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {(user.isDirector || user.isStaff) ? (
                            <span className="text-gray-400 text-xs font-medium italic">N/A (Personnel)</span>
                          ) : (
                            <button
                              onClick={() => { setEditingPromoUid(user.uid); setEditingPromoValue(getEffectiveYearPromo(user)?.toString() ?? ''); }}
                              className="group flex items-center gap-1"
                              title="Cliquer pour modifier l'année de promo"
                            >
                              {getEffectiveYearPromo(user) ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200">
                                  Prépa {getEffectiveYearPromo(user)}
                                </span>
                              ) : (
                                <span className="text-amber-600 text-xs font-medium group-hover:underline">⚠ Non défini</span>
                              )}
                              <Edit className="w-3 h-3 text-gray-300 group-hover:text-gray-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      { (user.isDirector || user.isStaff) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-100">
                          Administration
                        </span>
                      ) : user.status ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                          user.status === 'esigelec' ? 'bg-blue-100 text-blue-800' : 
                          user.status === 'cps' ? 'bg-purple-100 text-purple-800' : 
                          user.status === 'alumni' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                          {user.status === 'esigelec' ? 'ESIGELEC' : 
                           user.status === 'cps' ? 'CPS' : 
                           user.status === 'alumni' ? 'Alumni' : 
                           user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Autres
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col space-y-1">
                        {getUserRoles(user).length > 0 ? (
                          getUserRoles(user).map((badge, idx) => (
                            <span key={idx} className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${badge.color} ${badge.isBold ? 'font-bold' : ''}`}>
                              {badge.icon && <badge.icon className="w-3.5 h-3.5 mr-1" />}
                              {badge.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs italic">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          // Définir une date actuelle pour les profils sans date
                          if (!user.createdAt) {
                            return <span className="text-xs text-gray-400 italic">Non disponible</span>;
                          }
                          
                          try {
                            
                            
                            // Pour les objets Firestore Timestamp
                            if (user.createdAt && 
                                typeof user.createdAt === 'object' && 
                                'toDate' in user.createdAt && 
                                typeof user.createdAt.toDate === 'function') {
                              // Conversion du timestamp Firestore en date
                              const date = (user.createdAt as any).toDate();
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les objets avec seconds (timestamp Firestore brut)
                            if (user.createdAt && 
                                typeof user.createdAt === 'object' && 
                                'seconds' in user.createdAt && 
                                'nanoseconds' in user.createdAt) {
                              // Conversion du timestamp Firestore en date
                              const timestamp = user.createdAt as FirestoreTimestamp;
                              const seconds = timestamp.seconds;
                              const date = new Date(seconds * 1000);
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les chaînes au format "16 juin 2025 à 20:21:00 UTC"
                            if (typeof user.createdAt === 'string') {
                              if (user.createdAt.includes(' à ')) {
                                const parts = user.createdAt.split(' à ');
                                return (
                                  <>
                                    {parts[0]}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {parts[1]?.split(' ')[0] || ''}
                                    </span>
                                  </>
                                );
                              } else {
                                // Essayer de convertir la chaîne en date
                                const date = new Date(user.createdAt);
                                if (!isNaN(date.getTime())) {
                                  return (
                                    <>
                                      {date.toLocaleDateString('fr-FR')}
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </>
                                  );
                                } else {
                                  // Si la conversion échoue, on affiche la chaîne brute
                                  return <span>{user.createdAt}</span>;
                                }
                              }
                            }
                            
                            // Pour les timestamps numériques
                            if (typeof user.createdAt === 'number') {
                              const date = new Date(user.createdAt);
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les dates
                            if (user.createdAt instanceof Date) {
                              const date = user.createdAt;
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Fallback avec affichage du type pour aider au débogage
                            return <span className="text-xs">
                              {typeof user.createdAt}: {String(user.createdAt)}
                            </span>;
                            
                          } catch (error) {
                            console.error("Erreur de format de date:", error);
                            return <span className="text-xs text-red-500">
                              Format invalide
                            </span>;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-sm text-gray-600">
                        {(() => {
                          // Définir une date actuelle pour les profils sans date
                          if (!user.lastLogin) {
                            return <span className="text-xs text-gray-400 italic">Non disponible</span>;
                          }
                          
                          try {
                            
                            
                            // Pour les objets Firestore Timestamp
                            if (user.lastLogin && 
                                typeof user.lastLogin === 'object' && 
                                'toDate' in user.lastLogin && 
                                typeof user.lastLogin.toDate === 'function') {
                              // Conversion du timestamp Firestore en date
                              const date = (user.lastLogin as any).toDate();
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les objets avec seconds (timestamp Firestore brut)
                            if (user.lastLogin && 
                                typeof user.lastLogin === 'object' && 
                                'seconds' in user.lastLogin && 
                                'nanoseconds' in user.lastLogin) {
                              // Conversion du timestamp Firestore en date
                              const timestamp = user.lastLogin as FirestoreTimestamp;
                              const seconds = timestamp.seconds;
                              const date = new Date(seconds * 1000);
                              
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les chaînes au format "16 juin 2025 à 20:21:00 UTC"
                            if (typeof user.lastLogin === 'string') {
                              if (user.lastLogin.includes(' à ')) {
                                const parts = user.lastLogin.split(' à ');
                                return (
                                  <>
                                    {parts[0]}
                                    <br />
                                    <span className="text-xs text-gray-500">
                                      {parts[1]?.split(' ')[0] || ''}
                                    </span>
                                  </>
                                );
                              } else {
                                // Essayer de convertir la chaîne en date
                                const date = new Date(user.lastLogin);
                                if (!isNaN(date.getTime())) {
                                  return (
                                    <>
                                      {date.toLocaleDateString('fr-FR')}
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </>
                                  );
                                } else {
                                  // Si la conversion échoue, on affiche la chaîne brute
                                  return <span>{user.lastLogin}</span>;
                                }
                              }
                            }
                            
                            // Pour les timestamps numériques
                            if (typeof user.lastLogin === 'number') {
                              const date = new Date(user.lastLogin);
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Pour les dates
                            if (user.lastLogin instanceof Date) {
                              const date = user.lastLogin;
                              return (
                                <>
                                  {date.toLocaleDateString('fr-FR')}
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              );
                            }
                            
                            // Fallback avec affichage du type pour aider au débogage
                            return <span className="text-xs">
                              {typeof user.lastLogin}: {String(user.lastLogin)}
                            </span>;
                            
                          } catch (error) {
                            console.error("Erreur de format de date:", error);
                            return <span className="text-xs text-red-500">
                              Format invalide
                            </span>;
                          }
                        })()}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {(() => {
                        if (!user.lastActive) return <span className="text-xs text-gray-400 italic">Jamais</span>;
                        let date: Date | null = null;
                        if (typeof user.lastActive === 'object' && 'toDate' in user.lastActive && typeof (user.lastActive as FirestoreTimestamp).toDate === 'function') {
                          date = (user.lastActive as any).toDate();
                        } else if (typeof user.lastActive === 'object' && 'seconds' in user.lastActive) {
                          date = new Date((user.lastActive as FirestoreTimestamp).seconds * 1000);
                        } else if (user.lastActive instanceof Date) {
                          date = user.lastActive;
                        }
                        if (!date) return <span className="text-xs text-gray-400 italic">Jamais</span>;
                        const now = new Date();
                        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                        const label = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? "Hier" : `Il y a ${diffDays}j`;
                        const color = diffDays <= 7 ? 'text-green-600' : diffDays <= 30 ? 'text-amber-600' : 'text-red-500';
                        return (
                          <span className={`text-xs font-medium ${color}`} title={date.toLocaleString('fr-FR')}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-2">
                      {user.uid === currentUser?.uid ? (
                        <span className="text-xs text-gray-400 italic">Vous</span>
                      ) : user.isSuperAdmin && !currentUserIsSuperAdmin ? (
                        <span className="text-xs text-gray-400 italic">Non modifiable</span>
                      ) : canManageUsers ? (
                        <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenActionMenu(openActionMenu === user.uid ? null : user.uid)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
                          >
                            Rôle <ChevronDown className="w-3 h-3" />
                          </button>
                          {openActionMenu === user.uid && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-zinc-200 rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => { handleToggleAdmin(user.uid); setOpenActionMenu(null); }}
                                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 ${user.isAdmin ? 'text-red-600' : 'text-blue-700'}`}
                              >
                                {user.isAdmin ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                {user.isAdmin ? 'Retirer admin' : 'Rendre admin'}
                              </button>
                              <button
                                onClick={() => { handleToggleEditor(user.uid); setOpenActionMenu(null); }}
                                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 ${user.isEditor ? 'text-red-600' : 'text-green-700'}`}
                              >
                                {user.isEditor ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                                {user.isEditor ? 'Retirer éditeur' : 'Rendre éditeur'}
                              </button>
                              {!user.isAdmin && !user.isEditor && !user.isSuperAdmin && (
                                <>
                                  <div className="border-t border-zinc-100 my-1" />
                                  <button
                                    onClick={() => { handleToggleDirector(user.uid); setOpenActionMenu(null); }}
                                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 ${user.isDirector ? 'text-red-600' : 'text-purple-700'}`}
                                  >
                                    {user.isDirector ? <UserMinus className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                    {user.isDirector ? 'Retirer directeur' : 'Rendre directeur'}
                                  </button>
                                  <button
                                    onClick={() => { handleToggleStaff(user.uid); setOpenActionMenu(null); }}
                                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 ${user.isStaff ? 'text-red-600' : 'text-amber-700'}`}
                                  >
                                    {user.isStaff ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    {user.isStaff ? 'Retirer staff' : 'Rendre staff'}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 px-2">
              <div>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 mr-2 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  &laquo; Précédent
                </button>
                <button
                  onClick={() => {
                    const filteredUsers = users
                      .filter(user => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          user.displayName?.toLowerCase().includes(q) ||
                          user.email?.toLowerCase().includes(q) ||
                          getEffectiveYearPromo(user)?.toString().includes(q)
                        );
                      })
                      .filter(user => {
                        if (roleFilter === 'tous') return true;
                        if (roleFilter === 'admin') return user.isAdmin;
                        if (roleFilter === 'editor') return user.isEditor;
                        if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                        return true;
                      })
                      .filter(user => {
                        if (statusFilter === 'tous') return true;
                        if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                        return user.status === statusFilter;
                      })
                      .filter(user => {
                        if (!yearPromoFilter) return true;
                        return getEffectiveYearPromo(user)?.toString() === yearPromoFilter;
                      });

                    setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / usersPerPage), p + 1));
                  }}
                  disabled={
                    (() => {
                      const filteredUsers = users
                        .filter(user => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            user.displayName?.toLowerCase().includes(q) ||
                            user.email?.toLowerCase().includes(q) ||
                            getEffectiveYearPromo(user)?.toString().includes(q)
                          );
                        })
                        .filter(user => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            user.displayName?.toLowerCase().includes(q) ||
                            user.email?.toLowerCase().includes(q) ||
                            getEffectiveYearPromo(user)?.toString().includes(q)
                          );
                        })
                        .filter(user => {
                          if (roleFilter === 'tous') return true;
                          if (roleFilter === 'admin') return user.isAdmin;
                          if (roleFilter === 'editor') return user.isEditor;
                          if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                          return true;
                        })
                        .filter(user => {
                          if (statusFilter === 'tous') return true;
                          if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                          return user.status === statusFilter;
                        })
                        .filter(user => {
                          if (!yearPromoFilter) return true;
                          return getEffectiveYearPromo(user)?.toString() === yearPromoFilter;
                        });

                      return currentPage >= Math.ceil(filteredUsers.length / usersPerPage);
                    })()
                  }
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  Suivant &raquo;
                </button>
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  const filteredUsers = users
                    .filter(user => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        user.displayName?.toLowerCase().includes(q) ||
                        user.email?.toLowerCase().includes(q) ||
                        getEffectiveYearPromo(user)?.toString().includes(q)
                      );
                    })
                    .filter(user => {
                      if (roleFilter === 'tous') return true;
                      if (roleFilter === 'admin') return user.isAdmin;
                      if (roleFilter === 'editor') return user.isEditor;
                      if (roleFilter === 'standard') return !user.isAdmin && !user.isEditor;
                      return true;
                    })
                    .filter(user => {
                      if (statusFilter === 'tous') return true;
                      if (statusFilter === 'autres') return !user.status || user.status === 'autres';
                      return user.status === statusFilter;
                    })
                    .filter(user => {
                      if (!yearPromoFilter) return true;
                      return getEffectiveYearPromo(user)?.toString() === yearPromoFilter;
                    });

                  return `Page ${currentPage} sur ${Math.ceil(filteredUsers.length / usersPerPage) || 1}`;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
      <PasswordModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPendingUser(null); setModalError(null); }}
        onSubmit={handlePasswordSubmit}
        loading={modalLoading}
        error={modalError}
      />

      {/* Pending invitations section */}
      <div className="container mx-auto px-4 pb-10">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Invitations envoyées
            </h2>
            <button
              onClick={fetchInvitations}
              className="text-xs text-blue-700 hover:underline"
            >
              Actualiser
            </button>
          </div>
          {invitationsLoading ? (
            <div className="px-5 py-6 text-sm text-gray-500">Chargement...</div>
          ) : invitations.length === 0 ? (
            <div className="px-5 py-6 text-sm text-gray-400 italic">Aucune invitation envoyée.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date d'envoi</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiration</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-100">
                  {invitations.map((inv) => {
                    const createdDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : null;
                    const expiresDate = inv.expiresAt?.toDate ? inv.expiresAt.toDate() : null;
                    return (
                      <tr key={inv.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{inv.email}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {createdDate ? createdDate.toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {expiresDate ? expiresDate.toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            inv.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            inv.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {inv.status === 'pending' ? 'En attente' : inv.status === 'accepted' ? 'Acceptée' : 'Révoquée'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {inv.status === 'pending' && canManageUsers && (
                            <button
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline"
                            >
                              Révoquer
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invite user modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
              <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Inviter un utilisateur
              </h2>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendInvitation} className="px-6 py-5 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {inviteSuccess}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Rôle
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as typeof inviteRole)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Utilisateur</option>
                  <option value="editor">Éditeur</option>
                  <option value="director">Directeur</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Envoi...' : "Envoyer l'invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;

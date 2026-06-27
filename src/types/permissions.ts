export type Permission =
  | 'forum.read'
  | 'forum.write'
  | 'forum.delete'
  | 'forum.moderate'
  | 'resources.read'
  | 'resources.upload'
  | 'resources.manage'
  | 'faq.moderate'
  | 'alumni.view'
  | 'alumni.validate'
  | 'webinars.view'
  | 'webinars.manage'
  | 'workshops.view'
  | 'workshops.manage'
  | 'users.view'
  | 'users.manage'
  | 'admin.dashboard'
  | 'admin.roles'
  | 'admin.overrides'
  | 'admin.news'
  | 'broadcast.send'
  | 'ai.chat'
  | 'maintenance.toggle'
  | 'director.dashboard'
  | 'staff.dashboard'
  | 'recensement.manage'
  | 'storage.manage';

export interface RoleDoc {
  permissions: Permission[];
}

export interface UserOverrideDoc {
  extraPermissions: Permission[];
  blockedPermissions: Permission[];
}

export const ALL_PERMISSIONS: Permission[] = [
  'forum.read', 'forum.write', 'forum.delete', 'forum.moderate',
  'resources.read', 'resources.upload', 'resources.manage',
  'faq.moderate',
  'alumni.view', 'alumni.validate',
  'webinars.view', 'webinars.manage',
  'workshops.view', 'workshops.manage',
  'users.view', 'users.manage',
  'admin.dashboard', 'admin.roles', 'admin.overrides', 'admin.news', 'recensement.manage',
  'broadcast.send', 'ai.chat', 'maintenance.toggle',
  'director.dashboard', 'staff.dashboard',
  'storage.manage',
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  'forum.read': 'Lire',
  'forum.write': 'Poster',
  'forum.delete': 'Supprimer',
  'forum.moderate': 'Modérer',
  'resources.read': 'Consulter',
  'resources.upload': 'Uploader',
  'resources.manage': 'Gérer',
  'faq.moderate': 'Modérer la FAQ',
  'alumni.view': 'Voir annuaire',
  'alumni.validate': 'Valider profils',
  'webinars.view': 'Voir',
  'webinars.manage': 'Gérer',
  'workshops.view': 'Voir',
  'workshops.manage': 'Gérer',
  'users.view': 'Voir',
  'users.manage': 'Gérer',
  'admin.dashboard': 'Dashboard',
  'admin.roles': 'Rôles',
  'admin.overrides': 'Exceptions',
  'admin.news': 'Actualités',
  'broadcast.send': 'Email broadcast',
  'ai.chat': 'Chat IA',
  'maintenance.toggle': 'Maintenance',
  'director.dashboard': 'Portail directeur',
  'staff.dashboard': 'Portail staff',
  'recensement.manage': 'Gérer recensements',
  'storage.manage': 'Gérer stockage R2',
};

export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Forum: ['forum.read', 'forum.write', 'forum.delete', 'forum.moderate'],
  Ressources: ['resources.read', 'resources.upload', 'resources.manage'],
  FAQ: ['faq.moderate'],
  Alumni: ['alumni.view', 'alumni.validate'],
  Webinaires: ['webinars.view', 'webinars.manage'],
  Ateliers: ['workshops.view', 'workshops.manage'],
  Utilisateurs: ['users.view', 'users.manage'],
  Administration: ['admin.dashboard', 'admin.roles', 'admin.overrides', 'admin.news', 'recensement.manage', 'storage.manage'],
  'Super Admin': ['broadcast.send', 'ai.chat', 'maintenance.toggle'],
  'Portails spéciaux': ['director.dashboard', 'staff.dashboard'],
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [
    'forum.read', 'forum.write',
    'resources.read',
    'alumni.view',
    'webinars.view',
    'workshops.view',
  ],
  editor: [
    'forum.read', 'forum.write', 'forum.delete', 'forum.moderate',
    'resources.read', 'resources.upload', 'resources.manage',
    'faq.moderate',
    'alumni.view',
    'webinars.view', 'webinars.manage',
    'workshops.view', 'workshops.manage',
    'admin.news',
    'staff.dashboard',
    'storage.manage',
  ],
  admin: [
    'forum.read', 'forum.write', 'forum.delete', 'forum.moderate',
    'resources.read', 'resources.upload', 'resources.manage',
    'faq.moderate',
    'alumni.view', 'alumni.validate',
    'webinars.view', 'webinars.manage',
    'workshops.view', 'workshops.manage',
    'users.view', 'users.manage',
    'admin.dashboard', 'admin.news', 'recensement.manage', 'storage.manage',
  ],
  director: [
    'forum.read',
    'users.view',
    'webinars.view',
    'workshops.view',
    'admin.news',
    'director.dashboard',
  ],
  staff: [
    'forum.read', 'forum.write', 'forum.moderate',
    'resources.read', 'resources.upload', 'resources.manage',
    'faq.moderate',
    'webinars.view', 'webinars.manage',
    'workshops.view',
    'admin.news',
    'staff.dashboard',
  ],
  superAdmin: [...ALL_PERMISSIONS],
};

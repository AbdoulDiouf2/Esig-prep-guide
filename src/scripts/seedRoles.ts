/**
 * Script one-shot pour initialiser les documents /roles dans Firestore.
 * Exécuter UNE seule fois depuis la console Firebase ou via un outil CLI.
 *
 * Usage (dans la console Firebase ou un script Node avec firebase-admin) :
 *   await seedRoles(db);
 *
 * Ou coller le contenu dans la console Firebase → Firestore → Rules Playground.
 */
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_ROLE_PERMISSIONS } from '../types/permissions';

export async function seedRoles() {
  const roles = Object.entries(DEFAULT_ROLE_PERMISSIONS);

  await Promise.all(
    roles.map(([roleId, permissions]) =>
      setDoc(doc(db, 'roles', roleId), { permissions }, { merge: false })
    )
  );

  console.log('Roles seeded:', roles.map(([id]) => id));
}

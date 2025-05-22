import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES_COLLECTION = 'forumCategories';

/**
 * Utilitaire pour nettoyer les catégories dupliquées dans le forum
 * À exécuter une seule fois pour résoudre le problème des doublons
 */
export const cleanupDuplicateCategories = async (): Promise<void> => {
  try {
    console.log("Début du nettoyage des catégories dupliquées...");
    
    // Récupérer toutes les catégories
    const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION));
    const querySnapshot = await getDocs(categoriesQuery);
    
    // Mapper les documents par nom de catégorie
    const categoriesByName: Record<string, { id: string, order: number, count: number }[]> = {};
    
    querySnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const name = data.name;
      
      if (!categoriesByName[name]) {
        categoriesByName[name] = [];
      }
      
      categoriesByName[name].push({
        id: docSnapshot.id,
        order: data.order || 0,
        count: 0
      });
    });
    
    // Identifier les doublons et conserver uniquement le premier document pour chaque nom
    const docsToDelete: string[] = [];
    
    Object.keys(categoriesByName).forEach(name => {
      const docs = categoriesByName[name];
      
      if (docs.length > 1) {
        console.log(`Catégorie "${name}" trouvée ${docs.length} fois`);
        
        // Trier par ordre (pour conserver celui avec l'ordre le plus bas)
        docs.sort((a, b) => a.order - b.order);
        
        // Marquer tous les documents sauf le premier pour suppression
        for (let i = 1; i < docs.length; i++) {
          docsToDelete.push(docs[i].id);
        }
      }
    });
    
    // Supprimer les doublons
    if (docsToDelete.length > 0) {
      console.log(`Suppression de ${docsToDelete.length} catégories dupliquées...`);
      
      for (const docId of docsToDelete) {
        await deleteDoc(doc(db, CATEGORIES_COLLECTION, docId));
      }
      
      console.log("Nettoyage terminé avec succès!");
    } else {
      console.log("Aucun doublon trouvé.");
    }
    
    return;
  } catch (error) {
    console.error("Erreur lors du nettoyage des catégories dupliquées:", error);
    throw error;
  }
};

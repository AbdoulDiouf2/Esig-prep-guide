import React, { useEffect, useState, useCallback } from 'react';
import { getAllUserProgressions } from '../../services/adminProgressionService';
import { db } from '../../firebase';
import { DocumentData } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { getUserSubsectionData } from '../../services/subsectionDataService';
import { useContent } from '../../contexts/ContentContext';
import { Users, Plane, Check, X, Calendar, MapPin, Bus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  emailVerified: boolean;
  photoURL?: string;
  status?: string;
}

// Interface pour les données d'arrivée récupérées des sous-sections
interface ArrivalInfo {
  hasTicket: boolean;             // Achat de billet
  arrivalDate: string;            // Date d'arrivée
  arrivalTime: string;            // Heure d'arrivée
  airport: string;                // Aéroport d'arrivée
  hasOwnTransportation: boolean;  // Moyen de transport personnel
  wantGroupTransport: boolean;    // Souhait de prise en charge commune
}

// Interface pour typer correctement l'objet doc de jsPDF
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
  autoTable: (options: UserOptions) => jsPDF;
}

const AdminProgressionOverview: React.FC = () => {
  const { guideSections } = useContent();
  const [userProgressions, setUserProgressions] = useState<{ userId: string, completedSections: string[] }[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'progressions' | 'visa'>('progressions');
  const [arrivalData, setArrivalData] = useState<Record<string, ArrivalInfo>>({});
  const [exporting, setExporting] = useState(false);
  
  // Déterminer le statut visa selon les sections complétées
  // Défini avec useCallback pour éviter les re-rendus inutiles
  const getUserVisaStatus = useCallback((userId: string, progressions: { userId: string, completedSections: string[] }[]) => {
    // Utiliser uniquement les progressions fournies en paramètre, pas l'état userProgressions
    const progression = progressions.find(p => p.userId === userId);
    if (!progression) return null;
    
    // Vérifier si l'utilisateur a complété les sections spécifiques au visa
    const visaObtainedSection = guideSections.find(section => 
      section.title?.toLowerCase().includes('vous avez obtenu votre visa'));
    const visaRefusedSection = guideSections.find(section => 
      section.title?.toLowerCase().includes('en cas de refus de visa'));
    
    if (visaObtainedSection && progression.completedSections.includes(visaObtainedSection.id)) {
      return 'obtained';
    } else if (visaRefusedSection && progression.completedSections.includes(visaRefusedSection.id)) {
      return 'refused';
    }
    
    return null;
  }, [guideSections]); // Uniquement guideSections en dépendance

  // Fonction pour calculer la progression globale d'un utilisateur
  const getUserGlobalProgress = useCallback((completedSections: string[]) => {
    if (!guideSections || guideSections.length === 0) return 0;
    // Filtrer pour ne garder que les sections qui existent encore
    const validCompletedSections = completedSections.filter(sectionId => 
      guideSections.some(section => section.id === sectionId)
    );
    return Math.round((validCompletedSections.length / guideSections.length) * 100);
  }, [guideSections]);

  // Fonction pour exporter les données en Excel selon le statut visa (obtenu/refusé)
  const exportToExcel = useCallback((visaStatus: 'obtained' | 'refused') => {
    setExporting(true);
    try {
      // Filtrer les utilisateurs selon leur statut visa
      const filteredUsers = users.filter(user => 
        user.status === 'cps' && getUserVisaStatus(user.uid, userProgressions) === visaStatus
      );

      if (filteredUsers.length === 0) {
        alert(`Aucun étudiant avec visa ${visaStatus === 'obtained' ? 'obtenu' : 'refusé'} à exporter.`);
        setExporting(false);
        return;
      }

      // Préparer les données à exporter
      const exportData = filteredUsers.map(user => {
        const basicInfo = {
          'Nom': user.displayName || 'Non renseigné',
          'Email': user.email || 'Non renseigné',
          'Statut': user.status || 'Non renseigné',
          'Statut Visa': visaStatus === 'obtained' ? 'Obtenu' : 'Refusé'
        };

        // Ajouter les informations d'arrivée pour les visas obtenus
        if (visaStatus === 'obtained' && arrivalData[user.uid]) {
          const arrivalInfo = arrivalData[user.uid];
          return {
            ...basicInfo,
            'Billet d\'avion': arrivalInfo.hasTicket ? 'Oui' : 'Non',
            'Date d\'arrivée': arrivalInfo.arrivalDate || 'Non renseignée',
            'Heure d\'arrivée': arrivalInfo.arrivalTime || 'Non renseignée',
            'Aéroport': arrivalInfo.airport || 'Non renseigné',
            'Transport personnel': arrivalInfo.hasOwnTransportation ? 'Oui' : 'Non',
            'Prise en charge commune': arrivalInfo.wantGroupTransport ? 'Oui' : 'Non'
          };
        }

        return basicInfo;
      });

      // Créer une feuille de calcul Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook, 
        worksheet, 
        visaStatus === 'obtained' ? 'Visas Obtenus' : 'Visas Refusés'
      );

      // Générer le fichier Excel et le télécharger
      const fileName = visaStatus === 'obtained' 
        ? 'etudiants_visa_obtenus.xlsx' 
        : 'etudiants_visa_refuses.xlsx';
      
      XLSX.writeFile(workbook, fileName);
      console.log(`Données exportées pour les visas ${visaStatus}`);
    } catch (error) {
      console.error(`Erreur lors de l'exportation des données:`, error);
      alert(`Une erreur est survenue lors de l'exportation. Veuillez réessayer.`);
    } finally {
      setExporting(false);
    }
  }, [users, userProgressions, arrivalData, getUserVisaStatus]);

  // Fonction pour obtenir le nom de la phase
  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'pre-arrival':
        return 'Avant l\'arrivée';
      case 'during-process':
        return 'Pendant le processus';
      case 'post-cps':
        return 'Après le CPS';
      default:
        return 'Phase inconnue';
    }
  };

  // Fonction pour obtenir la progression par phase
  const getPhaseProgress = useCallback((completedSections: string[], phase: string) => {
    const phaseSections = guideSections.filter(section => section.phase === phase);
    if (phaseSections.length === 0) return 0;
    
    // Filtrer pour ne garder que les sections complétées qui existent dans la phase
    const validCompletedSections = completedSections.filter(sectionId => 
      phaseSections.some(section => section.id === sectionId)
    );
    
    return Math.round((validCompletedSections.length / phaseSections.length) * 100);
  }, [guideSections]);

  // Fonction pour exporter la progression en PDF
  const exportToPDF = useCallback(() => {
    setExporting(true);
    
    try {
      // Créer un nouveau document PDF avec le bon type
      const doc = new jsPDF() as JsPDFWithAutoTable;
      
      // Ajouter le titre
      doc.setFontSize(20);
      doc.text('Rapport de Progression des Étudiants CPS', 14, 20);
      
      // Ajouter la date
      doc.setFontSize(10);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Filtrer uniquement les utilisateurs avec le statut 'cps'
      const cpsUsers = users.filter(user => user.status === 'cps');
      
      // Préparer les données du tableau principal
      const tableData = cpsUsers.map(user => {
        const progression = userProgressions.find(p => p.userId === user.uid);
        const progress = progression ? getUserGlobalProgress(progression.completedSections) : 0;
        const visaStatus = progression ? getUserVisaStatus(user.uid, userProgressions) : 'N/A';
        
        return [
          user.displayName || 'Anonyme',
          user.email || 'Non renseigné',
          `${progress}%`,
          visaStatus === 'obtained' ? 'Obtenu' : visaStatus === 'refused' ? 'Refusé' : 'En attente'
        ];
      });
      
      // Vérifier s'il y a des données à afficher
      if (tableData.length === 0) {
        doc.setFontSize(12);
        doc.text("Aucun étudiant CPS trouvé.", 14, 50);
      } else {
        // Ajouter le tableau principal avec autoTable
        autoTable(doc, {
          head: [['Nom', 'Email', 'Progression', 'Statut Visa']],
          body: tableData,
          startY: 40,
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 40 },
          didDrawPage: (data) => {
            // Sauvegarder la position Y après le premier tableau
            data.settings.margin.top = 10;
          }
        });

        // Ajouter un saut de page avant le tableau des progressions par phase
        doc.addPage();
        
        // Titre pour la section des progressions par phase
        doc.setFontSize(16);
        doc.text('Détail des Progressions par Phase', 14, 20);
        
        // Préparer les données pour le tableau des progressions par phase
        const phaseProgressData = cpsUsers.flatMap(user => {
          const progression = userProgressions.find(p => p.userId === user.uid);
          if (!progression) return [];
          
          // Calculer la progression pour chaque phase
          const phases = ['post-cps', 'during-process', 'pre-arrival'];
          return phases.map(phase => ({
            name: user.displayName || 'Anonyme',
            email: user.email || 'Non renseigné',
            phase: getPhaseName(phase),
            progress: getPhaseProgress(progression.completedSections, phase) + '%'
          }));
        });
        
        // Convertir en format de tableau
        const phaseTableData = phaseProgressData.map(item => [
          item.name,
          item.email,
          item.phase,
          item.progress
        ]);
        
        // Ajouter le tableau des progressions par phase
        if (phaseTableData.length > 0) {
          autoTable(doc, {
            head: [['Nom', 'Email', 'Phase', 'Progression']],
            body: phaseTableData,
            startY: 30,
            headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { top: 30 }
          });
        }
        
        // Calculer les statistiques uniquement pour les utilisateurs CPS
        const totalUsers = cpsUsers.length;
        const completedUsers = cpsUsers.filter(user => {
          const progression = userProgressions.find(p => p.userId === user.uid);
          return progression && getUserGlobalProgress(progression.completedSections) === 100;
        }).length;
        
        // Ajouter les statistiques
        const finalY = doc.lastAutoTable?.finalY || 50;
        doc.setFontSize(14);
        doc.text('Statistiques', 14, finalY + 20);
        
        doc.setFontSize(10);
        doc.text(`• Nombre total d'étudiants CPS: ${totalUsers}`, 20, finalY + 30);
        doc.text(
          `• Étudiants ayant complété 100%: ${completedUsers} (${Math.round((completedUsers / (totalUsers || 1)) * 100)}%)`,
          20,
          finalY + 40
        );
      }
      
      // Sauvegarder le PDF
      doc.save(`progression_etudiants_cps_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF.');
    } finally {
      setExporting(false);
    }
  }, [users, userProgressions, getUserVisaStatus, getUserGlobalProgress, getPhaseProgress]);

  useEffect(() => {
    const fetchProgressions = async () => {
      setLoading(true);
      const [progressions, usersSnap] = await Promise.all([
        getAllUserProgressions(),
        import('firebase/firestore').then(({ collection, getDocs }) => getDocs(collection(db, 'users')))
      ]);
      const usersList: UserDoc[] = [];
      usersSnap.forEach((docSnap: DocumentData) => {
        usersList.push({ ...docSnap.data(), uid: docSnap.id } as UserDoc);
      });

      // Filtrer les progressions pour ne garder que les sections qui existent encore
      const validProgressions = progressions.map(progression => ({
        userId: progression.userId,
        completedSections: progression.completedSections.filter(sectionId => 
          guideSections.some(section => section.id === sectionId)
        )
      }));

      setUserProgressions(validProgressions);
      setUsers(usersList);
      setLoading(false);
      
      // Déclencher la récupération des données d'arrivée pour les utilisateurs ayant obtenu leur visa
      fetchArrivalData(usersList, validProgressions);
    };
    
    // Fonction pour récupérer les données d'arrivée depuis les sous-sections
    const fetchArrivalData = async (usersList: UserDoc[], progressions: { userId: string, completedSections: string[] }[]) => {
      const arrivalInfo: Record<string, ArrivalInfo> = {};
      
      // Récupérer les données d'arrivée pour les utilisateurs CPS ayant un statut visa (obtenu ou refusé)
      const usersWithVisaStatus = usersList.filter(user => 
        user.status === 'cps' && 
        (getUserVisaStatus(user.uid, progressions) === 'obtained' || getUserVisaStatus(user.uid, progressions) === 'refused')
      );
      
      for (const user of usersWithVisaStatus) {
        try {
          // Récupérer les données de sous-sections pour l'utilisateur
          const subsectionData = await getUserSubsectionData(user.uid);
          
          // Extraire les informations d'arrivée des données de sous-sections
          if (subsectionData && subsectionData.inputValues) {
            // Log pour debug
            console.log('Données de sous-section pour', user.displayName || user.uid);
            console.log('Valeurs disponibles (input values):', subsectionData.inputValues);
            console.log('Valeurs disponibles (typed values):', subsectionData.typedValues);            
            console.log('Statut visa:', getUserVisaStatus(user.uid, progressions));
            
            const values = subsectionData.inputValues;
            const valuesDate = subsectionData.typedValues;
            const keys = Object.keys(values || {});
            const keysDate = Object.keys(valuesDate || {});
            
            // Affichage DEBUG: toutes les valeurs avec leur clé pour diagnostiquer où se trouve la date
            console.log('==== Début DEBUG détaillé des valeurs ====');
            keys.forEach(key => {
              const val = values[key];
              console.log(`Clé: ${key} => Valeur: ${val} (Type: ${typeof val})`);
            });
            console.log('==== Fin DEBUG détaillé des valeurs ====')
            
            // Stratégie: chercher les clés par leurs valeurs ou patterns plutôt que par ID
            
            // Initialiser l'objet avec des valeurs par défaut
            const info: ArrivalInfo = {
              hasTicket: false,
              arrivalDate: '',
              arrivalTime: '',
              airport: '',
              hasOwnTransportation: false,
              wantGroupTransport: false
            };
            
            // Identifier la clé pour le billet d'avion - spécifiquement item-1750091257560-828 d'après les logs
            const ticketKey = keys.find(k => {
                // Clefs spécifiques observées dans les logs
                if (k === 'item-1750091257560-828' && values[k] === 'Oui') return true;
                
                // Recherche générique
                return (values[k] === 'Oui' || values[k] === 'yes') && 
                       (k.includes('ticket') || k.includes('billet'));
            });
            if (ticketKey) {
                info.hasTicket = true;
                console.log('Billet d\'avion détecté:', ticketKey, values[ticketKey]);
            }
            
            // Identifier la clé pour la date d'arrivée - algorithme amélioré
            const dateKey = keysDate.find(k => {
              // S'assurer que valuesDate existe
              if (!valuesDate) return false;
              
              const val = valuesDate[k];
              
              // Vérifier si c'est un objet Timestamp (Firebase)
              if (val && typeof val === 'object' && 'seconds' in val) {
                console.log('Timestamp trouvé dans la clé:', k, val);
                return true;
              }
              
              // Sinon, vérifier si la valeur est une chaîne
              if (typeof val !== 'string') return false;
              
              // Rechercher les formats de date courants
              // Formats: DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY, dates avec mois textuels, etc.
              const containsDateFormat = (
                val.match(/\d{2}\/\d{2}\/\d{4}/) || // format 29/08/2025
                val.match(/\d{4}\/\d{2}\/\d{2}/) || // format 2025/08/29
                val.match(/\d{2}-\d{2}-\d{4}/) || // format avec tirets
                val.match(/\d{2}:\d{2}/) || // format heure
                val.includes('2025') || // année spécifique
                val.includes('2024') || // autres années possibles
                val.includes('Janvier') || val.includes('Février') || val.includes('Mars') ||
                val.includes('Avril') || val.includes('Mai') || val.includes('Juin') ||
                val.includes('Juillet') || val.includes('Août') || val.includes('Septembre') ||
                val.includes('Octobre') || val.includes('Novembre') || val.includes('Décembre') ||
                // Versions sans accents pour plus de robustesse
                val.includes('Aout') || val.includes('Fevrier') || val.includes('Decembre')
              );
              
              // Debug des valeurs trouvées
              if (containsDateFormat) {
                console.log('Valeur de date potentielle trouvée:', val, 'dans la clé:', k);
              }
              
              return containsDateFormat;
            });
            
            if (dateKey) {
              // Récupérer la date depuis valuesDate et non values
              const fullDate = valuesDate ? valuesDate[dateKey] : null;
              console.log('Date trouvée:', fullDate);
              
              // Handle Firebase Timestamp object format
              if (fullDate && typeof fullDate === 'object' && fullDate !== null) {
                // Check if it's a Firebase Timestamp (has seconds property)
                const timestampObj = fullDate as { seconds?: number; nanoseconds?: number };
                
                if (typeof timestampObj.seconds === 'number') {
                  // Convert Firebase Timestamp to JavaScript Date
                  const date = new Date(timestampObj.seconds * 1000);
                  console.log('Date convertie:', date);
                  
                  // Format la date et l'heure pour l'objet info
                  info.arrivalDate = date.toLocaleDateString('fr-FR'); // Format: DD/MM/YYYY
                  info.arrivalTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // Format: HH:MM
                  
                  console.log('Date formatée:', info.arrivalDate);
                  console.log('Heure formatée:', info.arrivalTime);
                }
              }
              
              // Séparer date et heure si possible
              if (typeof fullDate === 'string') {
                // Gérer différents séparateurs possibles entre date et heure
                let parts: string[] = [];
                
                // Format avec 'à' comme séparateur: "05 Septembre 2025 à 12:00"
                if (fullDate.includes(' à ')) {
                  parts = fullDate.split(' à ');
                }
                // Format avec espace comme séparateur: "29/08/2025 12:50"
                else if (fullDate.match(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/)) {
                  const match = fullDate.match(/(.*)\s(\d{2}:\d{2})/);
                  if (match && match.length >= 3) {
                    parts = [match[1], match[2]];
                  }
                }
                // Autres séparateurs potentiels
                else if (fullDate.includes(' - ')) {
                  parts = fullDate.split(' - ');
                }
                
                // Appliquer le résultat du parsing
                if (parts.length > 1) {
                  info.arrivalDate = parts[0].trim();
                  info.arrivalTime = parts[1].trim();
                  console.log('Date parsée:', info.arrivalDate, 'Heure parsée:', info.arrivalTime);
                } else {
                  info.arrivalDate = fullDate;
                  console.log('Date non séparée:', info.arrivalDate);
                }
              }
            }
            
            // Identifier la clé pour l'aéroport
            const airportKey = keys.find(k => {
              const val = values[k];
              return typeof val === 'string' && 
                    (val === 'CDG' || val === 'ORY' || val.includes('Charles') || 
                     val.includes('Orly') || val.includes('airport'));
            });
            
            if (airportKey) info.airport = values[airportKey];
            
            // Affichage DEBUG pour les options de transport
            console.log('==== Début DEBUG options de transport ====');
            keys.forEach(key => {
              if (key.includes('transport') || values[key] === 'Oui' || values[key] === 'Non') {
                console.log(`Option potentielle de transport - Clé: ${key} => Valeur: ${values[key]}`);
              }
            });
            
            // Identifier la clé pour le transport personnel - selon les logs
            const ownTransportKey = keys.find(k => {
                // D'après les logs, il n'y a pas d'indication claire de transport personnel
                // Mais on garde la logique générique au cas où
                return (values[k] === 'Oui' || values[k] === 'yes') && 
                       (k.includes('own') || k.includes('personnel') || k.includes('propre') || k.includes('autonome'));
            });
            
            if (ownTransportKey) {
                info.hasOwnTransportation = true;
                console.log('Transport personnel détecté:', ownTransportKey, values[ownTransportKey]);
            }
            
            // Identifier la clé pour la prise en charge commune (transport groupé)
            const groupTransportKey = keys.find(k => {
                // Clé spécifique observée dans les logs
                if (k === 'item-1750091349655-561' && values[k] === 'Oui') return true;
                
                // Recherche générique
                return (values[k] === 'Oui' || values[k] === 'yes') && 
                       (k.includes('group') || k.includes('commun') || k.includes('navette') || k.includes('transport'));
            });
            
            if (groupTransportKey) {
                info.wantGroupTransport = true;
                console.log('Transport groupé détecté:', groupTransportKey, values[groupTransportKey]);
            }
            
            // Vérification des valeurs négatives (si explicitement "Non")
            const noGroupTransportKey = keys.find(k => {
                // Clé spécifique observée dans les logs
                if (k === 'item-1750091387480-385' && values[k] === 'Non') return true;
                
                // Recherche générique
                return (values[k] === 'Non' || values[k] === 'no') && 
                       (k.includes('group') || k.includes('commun') || k.includes('navette') || k.includes('transport'));
            });
            
            if (noGroupTransportKey) {
                info.wantGroupTransport = false;
                console.log('Refus de transport groupé détecté:', noGroupTransportKey, values[noGroupTransportKey]);
            }
            
            // Assigner les données trouvées
            arrivalInfo[user.uid] = info;
            
            // Log des données extraites
            console.log('Données d\'arrivée extraites:', arrivalInfo[user.uid]);
            console.log('Statut visa associé:', getUserVisaStatus(user.uid, progressions));
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération des données d'arrivée pour ${user.uid}:`, error);
        }
      }
      
      setArrivalData(arrivalInfo);
    };
    
    fetchProgressions();
  }, [guideSections, getUserVisaStatus]); // Ajout de getUserVisaStatus aux dépendances comme recommandé par ESLint

  // Filtrer les utilisateurs CPS 
  const cpsUsers = users.filter(user => user.status === 'cps');
  
  // Note: La fonction getUserVisaStatus a été déplacée plus haut dans le composant avec useCallback
  
  // Pour l'onglet "progressions", afficher tous les étudiants CPS
  const usersInProgress = cpsUsers;
  
  // Pour l'onglet "visa & arrivée", filtrer uniquement ceux avec un statut visa
  const usersWithVisaStatus = cpsUsers.filter(user => {
    const status = getUserVisaStatus(user.uid, userProgressions);
    return status === 'obtained' || status === 'refused';
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="inline-flex items-center px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-medium text-sm focus:outline-none">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Retour au dashboard
          </Link>
          <span className="flex items-center text-xl font-bold"><Users className="w-6 h-6 mr-2 text-white" /> Gestion des étudiants CPS</span>
        </div>
      </div>
      
      {/* Système d'onglets */}
      <div className="flex border-b border-gray-200 mb-4 bg-white shadow-sm">
        <button
          onClick={() => setActiveTab('progressions')}
          className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'progressions' 
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Users className="inline-block w-5 h-5 mr-2 -mt-1" />
          Progressions actuelles
        </button>
        <button
          onClick={() => setActiveTab('visa')}
          className={`flex-1 py-4 px-6 text-center font-medium ${activeTab === 'visa' 
            ? 'border-b-2 border-blue-500 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Plane className="inline-block w-5 h-5 mr-2 -mt-1" />
          Statut visa & Arrivée
        </button>
      </div>
      
      <div className="w-full mx-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500">Chargement des progressions...</div>
        ) : activeTab === 'progressions' ? (
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Liste des étudiants CPS</h3>
              <button 
                onClick={exportToPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <Download size={16} />
                {exporting ? 'Génération...' : 'Exporter en PDF'}
              </button>
            </div>
            <table className="w-full divide-y divide-gray-200 text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Nom</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase whitespace-nowrap">Email</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Progression globale</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Pré-arrivée</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Pendant le processus</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Post-CPS</th>
                  <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase whitespace-nowrap">Sections validées</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersInProgress
  .filter(user => !user.isAdmin && user.status === 'cps')
  .sort((a, b) => {
    const progressionA = userProgressions.find(p => p.userId === a.uid);
    const progressionB = userProgressions.find(p => p.userId === b.uid);
    const percentA = progressionA ? getUserGlobalProgress(progressionA.completedSections) : 0;
    const percentB = progressionB ? getUserGlobalProgress(progressionB.completedSections) : 0;
    return percentB - percentA;
  })
  .map(user => {
                  const progression = userProgressions.find(p => p.userId === user.uid);
                  // Assurons-nous que nous ne comptons que les sections qui existent encore
                  const validCompletedSections = progression ? progression.completedSections.filter(sectionId => 
                    guideSections.some(section => section.id === sectionId)
                  ) : [];
                  const completed = validCompletedSections.length;
                  const percent = progression ? getUserGlobalProgress(progression.completedSections) : 0;
                  const preArrivalPercent = progression ? getPhaseProgress(progression.completedSections, 'pre-arrival') : 0;
                  const duringProcessPercent = progression ? getPhaseProgress(progression.completedSections, 'during-process') : 0;
                  const postCpsPercent = progression ? getPhaseProgress(progression.completedSections, 'post-cps') : 0;
                  return (
                    <tr key={user.uid}>
                      <td className="px-2 py-2 whitespace-nowrap text-gray-900">{user.displayName || '-'}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-gray-600">{user.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{percent}%</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${preArrivalPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{preArrivalPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'pre-arrival').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && validCompletedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${duringProcessPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{duringProcessPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'during-process').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && validCompletedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center align-top">
                        <div className="w-32 bg-gray-200 rounded-full h-2.5 inline-block align-middle mb-1">
                          <div className="bg-blue-700 h-2.5 rounded-full" style={{ width: `${postCpsPercent}%` }}></div>
                        </div>
                        <span className="ml-2 text-xs font-semibold text-blue-800">{postCpsPercent}%</span>
                        <ul className="mt-2 text-xs text-left">
                          {guideSections.filter(s => s.phase === 'post-cps').map(section => (
                            <li key={section.id} className="flex items-center gap-1">
                              {progression && validCompletedSections.includes(section.id) ? (
                                <span className="text-green-600 font-bold">✔</span>
                              ) : (
                                <span className="text-red-500 font-bold">✗</span>
                              )}
                              <span>{section.title}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-center text-sm">{completed} / {guideSections.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Onglet Statut visa & Arrivée
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center justify-between shadow-sm">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Plane className="w-5 h-5 mr-2" /> Statut visa & Informations d'arrivée
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => exportToExcel('obtained')}
                  disabled={exporting}
                  className="group relative inline-flex items-center px-4 py-2 border border-green-500 text-sm font-medium rounded-md shadow-md bg-gradient-to-r from-green-400 to-green-600 text-white transition-all duration-200 transform hover:scale-102 hover:shadow-lg hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <Download className="h-4 w-4 mr-1.5 group-hover:animate-bounce" />
                  {exporting ? 
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportation en cours...
                    </span> : 
                    'Visas obtenus'
                  }
                </button>
                <button
                  onClick={() => exportToExcel('refused')}
                  disabled={exporting}
                  className="group relative inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-md shadow-md bg-gradient-to-r from-red-400 to-red-600 text-white transition-all duration-200 transform hover:scale-102 hover:shadow-lg hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                  <Download className="h-4 w-4 mr-1.5 group-hover:animate-bounce" />
                  {exporting ? 
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exportation en cours...
                    </span> : 
                    'Visas refusés'
                  }
                </button>
              </div>
            </div>
            
            {usersWithVisaStatus.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucun étudiant n'a encore obtenu ou s'est vu refuser son visa.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut visa</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'arrivée</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aéroport</th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Transport groupé</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersWithVisaStatus.map(user => (
                      <tr key={user.uid}>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.photoURL ? (
                              <img className="h-8 w-8 rounded-full mr-2" src={user.photoURL} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <Users className="h-4 w-4 text-blue-500" />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sans nom'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <Check className="h-4 w-4 mr-1" /> Obtenu
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              <X className="h-4 w-4 mr-1" /> Refusé
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' ? (
                            arrivalData[user.uid]?.hasTicket ? (
                              <div>
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mb-1">Billet acheté</span>
                                {arrivalData[user.uid]?.arrivalDate ? (
                                  <div className="flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-1 text-blue-500" /> 
                                    {arrivalData[user.uid].arrivalDate}
                                    {arrivalData[user.uid].arrivalTime && (
                                      <span className="ml-2 text-gray-700">à {arrivalData[user.uid].arrivalTime}</span>
                                    )}
                                  </div>
                                ) : 'Date non renseignée'}
                              </div>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pas encore de billet</span>
                            )
                          ) : getUserVisaStatus(user.uid, userProgressions) === 'refused' ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Visa refusé - Voyage annulé</span>
                          ) : (
                            <span className="text-gray-500">Statut visa indéterminé</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' ? (
                            arrivalData[user.uid]?.airport ? (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-blue-500" /> 
                                {arrivalData[user.uid].airport}
                              </div>
                            ) : (
                              'Non renseigné'
                            )
                          ) : getUserVisaStatus(user.uid, userProgressions) === 'refused' ? (
                            <span className="text-gray-500">Non applicable</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {getUserVisaStatus(user.uid, userProgressions) === 'obtained' ? (
                            <div className="flex flex-col space-y-2">
                              <div>
                                {arrivalData[user.uid]?.hasOwnTransportation ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Transport personnel</span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Sans transport</span>
                                )}
                              </div>
                              
                              <div>
                                {arrivalData[user.uid]?.wantGroupTransport ? (
                                  <div className="flex items-center justify-center">
                                    <Bus className="h-4 w-4 mr-1 text-green-600" /> 
                                    <span className="text-xs font-medium text-green-600">Prise en charge commune</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Pas de prise en charge</span>
                                )}
                              </div>
                            </div>
                          ) : getUserVisaStatus(user.uid, userProgressions) === 'refused' ? (
                            <span className="text-gray-500 italic">Voyage annulé</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProgressionOverview;

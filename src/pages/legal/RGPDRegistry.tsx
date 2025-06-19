import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Database, Shield, Users, ServerCrash, BookOpen, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SECURITY_MEASURES } from './constants';

const RGPDRegistry: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  
  // Vérifier si l'utilisateur est administrateur
  if (!currentUser || !isAdmin()) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/10 p-3 rounded-full">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 text-center">Accès restreint</h1>
            <p className="text-blue-100 text-center max-w-2xl mx-auto">
              Cette page est réservée aux administrateurs de la plateforme.
            </p>
            <div className="flex justify-center mt-6">
              <Link 
                to="/" 
                className="flex items-center text-blue-100 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto border border-gray-100">
            <div className="bg-red-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès administrateur requis</h2>
            <p className="text-gray-600 mb-6">
              Le registre RGPD est un document à usage interne destiné uniquement aux administrateurs. Veuillez vous connecter avec un compte disposant des privilèges administrateur pour y accéder.
            </p>
            <div className="flex justify-center">
              <Link 
                to="/login" 
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Registre de Traitement RGPD</h1>
          <div className="flex justify-center">
            <div className="flex items-center text-red-200 bg-red-700 px-4 py-2 rounded-md inline-block mt-2 shadow-sm">
              <Lock className="w-5 h-5 mr-2" />
              Document confidentiel à usage interne uniquement
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Link 
              to="/admin" 
              className="flex items-center text-blue-100 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-md"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-5xl mx-auto border border-gray-100">
          <div className="prose max-w-none">
            <div className="mb-8">
              <div className="flex items-center gap-3 bg-red-50 p-4 rounded-lg border border-red-200">
                <Lock className="w-6 h-6 text-red-600 flex-shrink-0" />
                <h2 className="text-xl font-bold text-red-800 m-0">CONFIDENTIEL - Registre des activités de traitement</h2>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100 mb-8">
              <p className="text-blue-800 font-medium">
                Conformément à l'article 30 du Règlement Général sur la Protection des Données (RGPD), ce registre recense l'ensemble des traitements de données à caractère personnel mis en œuvre par ESIG-prep-guide en tant que responsable de traitement.
              </p>
            </div>
            
            <div className="mb-12">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-6">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 m-0">1. Identité du responsable de traitement</h3>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="flex items-start">
                      <span className="font-semibold text-gray-700 mr-2 w-24 flex-shrink-0">Nom :</span>
                      <span>Abdoul Ahad Mbacké Diouf</span>
                    </p>
                    <p className="flex items-start">
                      <span className="font-semibold text-gray-700 mr-2 w-24 flex-shrink-0">Adresse :</span>
                      <span>76800; Saint-Etienne-Du-Rouvray, France</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-start">
                      <span className="font-semibold text-gray-700 mr-2 w-24 flex-shrink-0">Email :</span>
                      <span>aad.mbacke691@gmail.com</span>
                    </p>
                    <p className="flex items-start mt-3">
                      <span className="font-semibold text-gray-700 mr-2 w-24 flex-shrink-0">Téléphone :</span>
                      <span>+33 7 49 05 18 79</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="flex items-start">
                    <span className="font-semibold text-gray-700 mr-2">Délégué à la protection des données :</span>
                    <span>Abdoul Ahad Mbacké Diouf (responsable auto-désigné)</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Traitement 1: Gestion des comptes utilisateurs */}
            <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                <Database className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 m-0">Traitement 1: Gestion des comptes utilisateurs</h3>
              </div>
              
              <table className="min-w-full border-collapse border border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium w-1/3">Finalité du traitement</td>
                    <td className="border border-gray-300 p-3">Gestion des comptes utilisateurs et authentification</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Sous-finalités</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Création et gestion de compte</li>
                        <li>Authentification des utilisateurs</li>
                        <li>Récupération de mot de passe</li>
                        <li>Vérification d'email</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Base légale</td>
                    <td className="border border-gray-300 p-3">
                      <p>Exécution contractuelle (CGU) et consentement</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Catégories de données</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Identifiants: nom, prénom, adresse email</li>
                        <li>Données de compte: mot de passe (hashé), rôle</li>
                        <li>Données de connexion: timestamp, adresse IP</li>
                        <li>Données de profil: photo (facultatif)</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Catégories de personnes concernées</td>
                    <td className="border border-gray-300 p-3">Utilisateurs de la plateforme</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Destinataires</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>En interne: administrateurs de la plateforme</li>
                        <li>En externe: Firebase (sous-traitant pour l'authentification)</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Durée de conservation</td>
                    <td className="border border-gray-300 p-3">
                      <p>Aussi longtemps que le compte est actif + 1 an après suppression pour des raisons techniques et légales</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Mesures de sécurité</td>
                    <td className="border border-gray-300 p-3">
                      <p className="font-medium mb-2">Mesures organisationnelles :</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {SECURITY_MEASURES.organizational.map((item: string, index: number) => (
                          <li key={`org-${index}`}>{item}</li>
                        ))}
                      </ul>
                      <p className="font-medium mt-4 mb-2">Mesures techniques :</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {SECURITY_MEASURES.technical.map((item: string, index: number) => (
                          <li key={`tech-${index}`}>{item}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        Les mesures de sécurité mises en œuvre par nos sous-traitants (notamment Firebase) sont conformes aux normes industrielles et aux exigences du RGPD.
                      </p>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Transfert hors UE</td>
                    <td className="border border-gray-300 p-3">
                      <p>Oui (Firebase - USA) - Garanties: clauses contractuelles types</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Traitement 2: Gestion des questions FAQ */}
            <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 m-0">Traitement 2: Gestion des questions FAQ</h3>
              </div>
              
              <table className="min-w-full border-collapse border border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium w-1/3">Finalité du traitement</td>
                    <td className="border border-gray-300 p-3">Gestion des questions posées par les utilisateurs</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Sous-finalités</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Recueil des questions des utilisateurs</li>
                        <li>Modération et publication des questions</li>
                        <li>Réponse aux questions</li>
                        <li>Constitution d'une base de connaissances</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Base légale</td>
                    <td className="border border-gray-300 p-3">
                      <p>Consentement et intérêt légitime</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Catégories de données</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Identifiants: ID utilisateur, email</li>
                        <li>Contenu: question posée, catégorie, phase</li>
                        <li>Métadonnées: date de soumission, statut de la question</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Catégories de personnes concernées</td>
                    <td className="border border-gray-300 p-3">Utilisateurs de la plateforme</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Destinataires</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>En interne: administrateurs et modérateurs</li>
                        <li>En externe: Firebase (sous-traitant pour le stockage des données)</li>
                        <li>Public: questions approuvées et répondues</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Durée de conservation</td>
                    <td className="border border-gray-300 p-3">
                      <p>Questions publiées: durée de vie de la plateforme</p>
                      <p>Questions refusées: 1 an après refus</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Mesures de sécurité</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Accès restreint aux données complètes (admin uniquement)</li>
                        <li>Modération avant publication</li>
                        <li>Règles de sécurité Firebase</li>
                        <li>Transmission des données via HTTPS</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Transfert hors UE</td>
                    <td className="border border-gray-300 p-3">
                      <p>Oui (Firebase - USA) - Garanties: clauses contractuelles types</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Traitement 3: Gestion des ressources documentaires */}
            <div className="mb-12 border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 m-0">Traitement 3: Gestion des ressources documentaires</h3>
              </div>
              
              <table className="min-w-full border-collapse border border-gray-300">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium w-1/3">Finalité du traitement</td>
                    <td className="border border-gray-300 p-3">Gestion et mise à disposition des ressources documentaires</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Sous-finalités</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Publication de documents informatifs</li>
                        <li>Catégorisation des ressources</li>
                        <li>Accès contrôlé aux ressources</li>
                        <li>Suivi statistique des consultations</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Base légale</td>
                    <td className="border border-gray-300 p-3">
                      <p>Exécution contractuelle (CGU) et intérêt légitime</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Catégories de données</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Métadonnées des ressources: titre, description, catégorie, phase</li>
                        <li>Données d'accès: identifiant utilisateur, timestamp d'accès</li>
                        <li>Statistiques anonymisées: nombre de consultations</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Catégories de personnes concernées</td>
                    <td className="border border-gray-300 p-3">Utilisateurs de la plateforme, administrateurs</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Destinataires</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>En interne: administrateurs</li>
                        <li>En externe: Firebase (stockage des métadonnées), Dropbox (stockage des fichiers)</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Durée de conservation</td>
                    <td className="border border-gray-300 p-3">
                      <p>Métadonnées des ressources: durée de vie de la plateforme</p>
                      <p>Données d'accès individuelles: 1 an</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium">Mesures de sécurité</td>
                    <td className="border border-gray-300 p-3">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Authentification requise pour l'accès aux ressources</li>
                        <li>Gestion des droits d'accès</li>
                        <li>Transmission sécurisée via HTTPS</li>
                        <li>Sécurité des liens de téléchargement</li>
                      </ul>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">Transfert hors UE</td>
                    <td className="border border-gray-300 p-3">
                      <p>Oui (Firebase - USA, Dropbox - USA) - Garanties: clauses contractuelles types</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-12 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <ServerCrash className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800 m-0">Mise à jour du registre</h3>
              </div>
              <p className="text-gray-700">
                Ce registre est mis à jour régulièrement pour refléter l'évolution des traitements de données effectués.
              </p>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <div className="bg-blue-50 rounded-lg p-4 flex items-start"> 
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Document obligatoire</p>
                    <p className="text-sm text-blue-700 mt-1">Conformément au RGPD, ce registre des activités de traitement doit être conservé à jour et présenté sur demande à la CNIL. Il constitue un élément essentiel de la conformité au RGPD.</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-6 text-center">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RGPDRegistry;

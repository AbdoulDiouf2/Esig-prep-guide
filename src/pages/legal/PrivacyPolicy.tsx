import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Database, EyeOff, Server, FileText, Users, Globe, KeyRound } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Politique de Confidentialité</h1>
          <p className="text-blue-100 text-center max-w-2xl mx-auto">
            Nous accordons une grande importance à la protection de vos données personnelles. Ce document détaille comment nous les collectons et les utilisons.
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
      
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 max-w-4xl mx-auto border border-gray-100">
          <div className="prose max-w-none">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">1. Introduction</h2>
            </div>
            <p>
              La présente Politique de Confidentialité décrit comment la plateforme ESIG-prep-guide (ci-après "la Plateforme") collecte, utilise et protège vos données personnelles lorsque vous utilisez notre service.
            </p>
            <p>
              Nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et aux autres lois applicables en matière de protection des données.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">2. Responsable du traitement</h2>
            </div>
            <p>
              Le responsable du traitement de vos données personnelles est [Votre Nom/Organisation], joignable à l'adresse email suivante : [Votre adresse email].
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">3. Quelles données collectons-nous ?</h2>
            </div>
            <p>
              Nous pouvons collecter les types de données personnelles suivants :
            </p>
            <ul>
              <li>
                <strong>Données d'identification</strong> : nom, prénom, adresse email, identifiant utilisateur, année de promotion
              </li>
              <li>
                <strong>Données de connexion</strong> : adresse IP, type de navigateur, système d'exploitation, date et heure de connexion
              </li>
              <li>
                <strong>Données d'utilisation</strong> : interactions avec la Plateforme, questions posées, ressources consultées
              </li>
              <li>
                <strong>Données de profil</strong> : préférences, centres d'intérêt en lien avec votre utilisation de la Plateforme
              </li>
              <li>
                <strong>Données de profil Alumni (optionnel)</strong> : entreprise, poste, secteurs d'activité, expertises, localisation (pays, ville), biographie, photo de profil, liens vers réseaux sociaux professionnels (LinkedIn, GitHub, Twitter, site web personnel)
              </li>
            </ul>
            
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
              <p className="text-sm text-purple-800 mb-2">
                <strong>🆕 Profils Alumni :</strong>
              </p>
              <p className="text-sm text-purple-700">
                Si vous choisissez de créer un profil alumni, les informations que vous fournissez seront visibles publiquement dans l'annuaire alumni après validation par un administrateur. Vous pouvez à tout moment modifier ou supprimer votre profil alumni depuis votre espace personnel.
              </p>
            </div>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">4. Comment collectons-nous vos données ?</h2>
            </div>
            <p>
              Nous collectons vos données de différentes manières :
            </p>
            <ul>
              <li>
                <strong>Directement auprès de vous</strong> : lorsque vous créez un compte, complétez un formulaire, posez une question, ou interagissez avec notre Plateforme
              </li>
              <li>
                <strong>Automatiquement</strong> : à travers des cookies et technologies similaires lorsque vous naviguez sur notre Plateforme
              </li>
              <li>
                <strong>Auprès de tiers</strong> : lorsque vous vous connectez via des services tiers comme Google
              </li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">5. Pourquoi utilisons-nous vos données ?</h2>
            </div>
            <p>
              Nous utilisons vos données personnelles pour les finalités suivantes :
            </p>
            <ul>
              <li>Vous permettre de créer et de gérer votre compte utilisateur</li>
              <li>Vous fournir les services et fonctionnalités de la Plateforme</li>
              <li>Répondre à vos questions et demandes</li>
              <li>Personnaliser votre expérience sur la Plateforme</li>
              <li>Améliorer et développer notre Plateforme</li>
              <li>Assurer la sécurité de la Plateforme et prévenir les fraudes</li>
              <li>Respecter nos obligations légales</li>
              <li><strong>Gérer l'annuaire alumni</strong> : afficher votre profil dans l'annuaire après validation, faciliter le networking entre anciens étudiants</li>
              <li><strong>Modération des profils alumni</strong> : valider, approuver ou rejeter les profils soumis pour garantir la qualité de l'annuaire</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">6. Base légale du traitement</h2>
            </div>
            <p>
              Nous traitons vos données personnelles sur les bases légales suivantes :
            </p>
            <ul>
              <li>
                <strong>Exécution du contrat</strong> : le traitement est nécessaire à l'exécution du contrat auquel vous êtes partie (les Conditions Générales d'Utilisation)
              </li>
              <li>
                <strong>Consentement</strong> : vous avez donné votre consentement au traitement de vos données à caractère personnel pour une ou plusieurs finalités spécifiques
              </li>
              <li>
                <strong>Intérêts légitimes</strong> : le traitement est nécessaire aux fins des intérêts légitimes poursuivis par nous ou par un tiers
              </li>
              <li>
                <strong>Obligation légale</strong> : le traitement est nécessaire au respect d'une obligation légale à laquelle nous sommes soumis
              </li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">7. Durée de conservation</h2>
            </div>
            <p>
              Nous conservons vos données personnelles uniquement pendant la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, y compris pour satisfaire aux exigences légales, comptables ou de déclaration.
            </p>
            <p>
              Vos données de compte utilisateur sont conservées tant que votre compte est actif. En cas de suppression de votre compte, vos données personnelles sont supprimées ou anonymisées dans un délai raisonnable.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">8. Partage de vos données</h2>
            </div>
            <p>
              Nous pouvons partager vos données personnelles avec :
            </p>
            <ul>
              <li>
                <strong>Nos prestataires de services</strong> : qui nous aident à fournir nos services (hébergement, maintenance, analyses, etc.)
              </li>
              <li>
                <strong>Des tiers avec votre consentement</strong> : lorsque vous nous avez autorisés à le faire
              </li>
              <li>
                <strong>Les autorités compétentes</strong> : lorsque nous sommes légalement tenus de le faire
              </li>
            </ul>
            <p>
              Nous ne vendons pas vos données personnelles à des tiers.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">9. Transfert de données hors UE</h2>
            </div>
            <p>
              Certains de nos prestataires de services peuvent être basés en dehors de l'Espace Économique Européen (EEE). Lorsque nous transférons vos données personnelles en dehors de l'EEE, nous nous assurons qu'elles bénéficient d'un niveau de protection similaire en mettant en œuvre des garanties appropriées (clauses contractuelles types, décisions d'adéquation, etc.).
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">10. Vos droits</h2>
            </div>
            <p>
              Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
            </p>
            <ul>
              <li><strong>Droit d'accès</strong> : vous pouvez demander une copie des données personnelles que nous détenons à votre sujet</li>
              <li><strong>Droit de rectification</strong> : vous pouvez demander la correction de données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement</strong> : vous pouvez demander la suppression de vos données personnelles dans certaines circonstances</li>
              <li><strong>Droit à la limitation du traitement</strong> : vous pouvez demander la limitation du traitement de vos données personnelles</li>
              <li><strong>Droit à la portabilité des données</strong> : vous pouvez demander le transfert de vos données personnelles à un autre responsable du traitement</li>
              <li><strong>Droit d'opposition</strong> : vous pouvez vous opposer au traitement de vos données personnelles dans certaines circonstances</li>
              <li><strong>Droit de retirer votre consentement</strong> : lorsque le traitement est basé sur votre consentement</li>
            </ul>
            <p>
              Pour exercer ces droits, veuillez nous contacter à l'adresse email suivante : [Votre adresse email].
            </p>
            <p>
              Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL).
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <KeyRound className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">11. Sécurité des données</h2>
            </div>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre la perte, l'utilisation abusive, l'accès non autorisé, la divulgation, l'altération ou la destruction. Parmi ces mesures :
            </p>
            <ul>
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Authentification forte pour l'accès aux comptes</li>
              <li>Stockage sécurisé des mots de passe (hachage avec algorithme robuste)</li>
              <li>Accès restreint aux données personnelles aux seules personnes autorisées</li>
              <li>Surveillance régulière de nos systèmes pour détecter les vulnérabilités potentielles</li>
            </ul>
            <p>
              Nous utilisons les services de Firebase (Google Cloud Platform) pour l'hébergement et le traitement des données, qui mettent en œuvre des mesures de sécurité de haut niveau conformes aux normes industrielles.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Server className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">12. Sous-traitants</h2>
            </div>
            <p>
              Nous faisons appel aux sous-traitants suivants pour l'hébergement et le traitement des données :
            </p>
            <ul>
              <li>
                <strong>Firebase (Google Cloud Platform)</strong> : hébergement, base de données, authentification et stockage des fichiers
                <ul className="list-disc pl-5 mt-1">
                  <li>Politique de confidentialité : <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://firebase.google.com/support/privacy</a></li>
                  <li>Pays de localisation : France (région europe-west1 - Belgique) et États-Unis</li>
                  <li>Garanties : Clauses contractuelles types de la Commission européenne</li>
                </ul>
              </li>
            </ul>
            <p className="mt-4">
              Ces sous-traitants sont tenus par contrat de respecter la confidentialité de vos données et de ne pas les utiliser à d'autres fins que celles pour lesquelles nous les leur communiquons.
            </p>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout traitement non autorisé ou illégal et contre toute perte, destruction ou dommage accidentels.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Server className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">12. Cookies et technologies similaires</h2>
            </div>
            <p>
              Notre Plateforme utilise des cookies et des technologies similaires pour améliorer votre expérience et recueillir des informations sur l'utilisation de la Plateforme. Vous pouvez gérer vos préférences en matière de cookies via notre bannière de consentement aux cookies.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">13. Modification de la politique de confidentialité</h2>
            </div>
            <p>
              Nous pouvons modifier cette politique de confidentialité de temps à autre. Toute modification sera publiée sur cette page et, si les modifications sont importantes, nous vous fournirons une notification plus visible.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">14. Contact</h2>
            </div>
            <p>
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles, veuillez nous contacter à l'adresse email suivante : [Votre adresse email].
            </p>

            <div className="mt-12 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-4 flex items-start"> 
                <EyeOff className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Protection de vos données personnelles</p>
                  <p className="text-sm text-blue-700 mt-1">Conformément au Règlement Général sur la Protection des Données (RGPD), vous pouvez à tout moment exercer vos droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition aux données vous concernant.</p>
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
  );
};

export default PrivacyPolicy;

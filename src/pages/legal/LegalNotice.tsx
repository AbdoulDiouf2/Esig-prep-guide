import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookText, Building, Server, Copyright, Scale, Landmark, Globe, Phone, Mail, AlertTriangle } from 'lucide-react';

const LegalNotice: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 p-3 rounded-full">
              <BookText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-3 text-center">Mentions Légales</h1>
          <p className="text-blue-100 text-center max-w-2xl mx-auto">
            Informations légales relatives à l'éditeur du site et aux conditions d'hébergement.
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
              <Building className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">1. Éditeur du site</h2>
            </div>
            <p>
              Le site ESIG-prep-guide (ci-après "le Site") est édité par :
            </p>
            <p>
              <strong>Nom :</strong> Abdoul Ahad Mbacké Diouf<br />
              <strong>Adresse :</strong> 76800; Saint-Etienne-Du-Rouvray<br />
              <strong>Email :</strong> aad.mbacke691@gmail.com<br />
              <strong>Téléphone :</strong> +33 7 49 05 18 79
            </p>
            <p>
              <strong>Directeur de la publication :</strong> Abdoul Ahad Mbacké Diouf
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Server className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">2. Hébergement</h2>
            </div>
            <p>
              Le Site est hébergé par :
            </p>
            <p>
              <strong>Société :</strong> Vercel Inc.<br />
              <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis<br />
              <strong>Site web :</strong> <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer">https://vercel.com/</a>
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Copyright className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">3. Propriété intellectuelle</h2>
            </div>
            <p>
              L'ensemble des éléments constituant le Site (textes, graphismes, logiciels, images, sons, plans, etc.) est la propriété exclusive d'Abdoul Ahad Mbacké Diouf ou fait l'objet d'une autorisation d'utilisation. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du Site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
            </p>
            <p>
              Toute exploitation non autorisée du Site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">4. Responsabilité</h2>
            </div>
            <p>
              Les informations fournies sur le Site le sont à titre informatif. Abdoul Ahad Mbacké Diouf s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées, mais ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur le Site.
            </p>
            <p>
              Abdoul Ahad Mbacké Diouf ne saurait être tenu responsable :
            </p>
            <ul>
              <li>Des éventuelles interruptions du Site pour des raisons de maintenance ou autres</li>
              <li>Des erreurs, inexactitudes ou omissions dans les informations fournies</li>
              <li>Des conséquences de l'utilisation du Site</li>
              <li>De tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur le Site</li>
            </ul>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">5. Liens hypertextes</h2>
            </div>
            <p>
              Le Site peut contenir des liens hypertextes vers d'autres sites internet. Abdoul Ahad Mbacké Diouf n'exerce aucun contrôle sur ces sites et n'assume aucune responsabilité quant à leur contenu.
            </p>
            <p>
              La création de liens hypertextes vers le Site est autorisée sous réserve :
            </p>
            <ul>
              <li>Que les liens ne soient pas utilisés à des fins commerciales ou publicitaires</li>
              <li>Qu'ils n'induisent pas de confusion sur l'origine des services ou contenus du Site</li>
              <li>Qu'ils ne portent pas atteinte aux intérêts d'Abdoul Ahad Mbacké Diouf</li>
            </ul>
            <p>
              Abdoul Ahad Mbacké Diouf se réserve le droit de demander la suppression de tout lien hypertexte pointant vers le Site qui ne respecterait pas ces conditions.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">6. Protection des données personnelles</h2>
            </div>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez de droits concernant vos données personnelles. Pour en savoir plus, veuillez consulter notre <Link to="/legal/privacy-policy">Politique de Confidentialité</Link>.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Scale className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">7. Droit applicable et juridiction compétente</h2>
            </div>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige non résolu à l'amiable, les tribunaux français seront seuls compétents.
            </p>

            <div className="flex items-center gap-3 border-b border-gray-200 pb-2 mb-4 mt-8">
              <Phone className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800 m-0">8. Contact</h2>
            </div>
            <p>
              Pour toute question relative aux présentes mentions légales, vous pouvez contacter Abdoul Ahad Mbacké Diouf à l'adresse suivante : [Votre adresse email].
            </p>

            <div className="mt-12 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 rounded-lg p-4 flex items-start"> 
                <Landmark className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Informations obligatoires</p>
                  <p className="text-sm text-blue-700 mt-1">Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site ESIG-prep-guide l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi. Ce site utilise les services de Firebase (Google Cloud Platform) pour l'hébergement, l'authentification et la gestion des données.</p>
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

export default LegalNotice;

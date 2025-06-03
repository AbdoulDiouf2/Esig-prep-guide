import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users,  
  ArrowRight,
  User,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserCheck,
  Info,
  GraduationCap,
  Building,
  Sparkles
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export interface Webinar {
  id: string;
  title: string;
  description: string;
  date: Date;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  speaker: {
    name: string;
    title: string;
    avatar?: string;
  };
  meetingLink?: string;
  isLive: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  tags: string[];
  createdBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface WebinarCardProps {
  webinar: Webinar;
}

const WebinarCard: React.FC<WebinarCardProps> = ({ webinar }) => {
  // Catégories dynamiques avec icônes
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'workshop':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'coaching':
        return <UserCheck className="h-5 w-5 text-purple-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-green-500" />;
      case 'campus-france':
        return <GraduationCap className="h-5 w-5 text-red-500" />;
      case 'academique':
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
      case 'installation':
        return <Building className="h-5 w-5 text-indigo-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Libellés des catégories
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      workshop: 'Atelier',
      coaching: 'Coaching',
      info: 'Information',
      'campus-france': 'Campus France',
      academique: 'Académique',
      installation: 'Installation'
    };
    return labels[category.toLowerCase()] || category;
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  const levelLabels = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé'
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isFull = webinar.currentParticipants >= webinar.maxParticipants;
  const registrationClosed = webinar.isCompleted || isFull;

  return (
    <div 
      className={`flex flex-col rounded-xl shadow-sm overflow-hidden h-full transition-all duration-200 hover:shadow-md ${
        registrationClosed ? 'opacity-75' : 'hover:-translate-y-1'
      }`}
    >
      <div className="relative">
        {webinar.imageUrl ? (
          <img 
            src={webinar.imageUrl} 
            alt={webinar.title}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
            <Video className="h-16 w-16 text-white opacity-20" />
          </div>
        )}
        
        {webinar.isLive && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-sm font-medium">
              <span className="flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              En direct
            </div>
          </div>
        )}
        
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            levelColors[webinar.level] || 'bg-gray-100 text-gray-800'
          }`}>
            {levelLabels[webinar.level] || webinar.level}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getCategoryIcon(webinar.category)}
            <span className="ml-1">{getCategoryLabel(webinar.category)}</span>
          </span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-6 bg-white">
        <div className="flex-1">
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <time dateTime={webinar.date.toISOString()}>
              {formatDate(webinar.date)}
            </time>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
            {webinar.title}
          </h3>
          
          <p className="mt-2 text-gray-600 line-clamp-3">
            {webinar.description}
          </p>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>{webinar.duration} minutes</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Users className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
              <span>
                {webinar.currentParticipants} / {webinar.maxParticipants} participants
                {isFull && ' (Complet)'}
              </span>
            </div>
            
            <div className="flex items-start text-sm text-gray-500">
              <User className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">{webinar.speaker.name}</p>
                <p className="text-gray-500">{webinar.speaker.title}</p>
              </div>
            </div>
          </div>
          
          {webinar.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {webinar.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          {webinar.isCompleted ? (
            <div className="text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Session terminée
              </div>
              {webinar.meetingLink && (
                <a 
                  href={webinar.meetingLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  Voir l'enregistrement <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              )}
            </div>
          ) : isFull ? (
            <div className="text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                Complet
              </div>
            </div>
          ) : webinar.isLive ? (
            <a
              href={webinar.meetingLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <span className="flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Rejoindre maintenant
            </a>
          ) : (
            <Link
              to={`/webinars/${webinar.id}`}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              S'inscrire maintenant
            </Link>
          )}
          
          {!webinar.isCompleted && !isFull && webinar.isUpcoming && !webinar.isLive && (
            <div className="mt-2 text-center text-xs text-gray-500">
              <ClockIcon className="inline-block h-3 w-3 mr-1" />
              {(() => {
                const today = new Date();
                const webinarDate = new Date(webinar.date);
                const diffTime = webinarDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 0) {
                  return "Inscriptions closes";
                } else if (diffDays === 1) {
                  return "Clôture des inscriptions aujourd'hui";
                } else if (diffDays === 2) {
                  return "Clôture des inscriptions demain";
                } else {
                  return `Clôture des inscriptions dans ${diffDays} jours`;
                }
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebinarCard;

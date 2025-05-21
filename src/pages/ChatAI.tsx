import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  Bot, 
  ArrowLeft, 
  Plane, 
  HelpCircle, 
  Home, 
  Calendar, 
  Map, 
  FileText,
  User
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatAI: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialisation du chatbot avec un message de bienvenue
  useEffect(() => {
    const welcomeMessages = [
      {
        id: '1',
        text: `Bonjour ${currentUser?.displayName || 'cher utilisateur'} ! Je suis EsiBot, votre assistant personnel pour votre parcours vers l'ESIGELEC.`,
        sender: 'bot' as const,
        timestamp: new Date()
      },
      {
        id: '2',
        text: "Je peux vous aider avec les réservations de voyage, la planification de votre déménagement, et répondre à vos questions sur l'école ou les démarches administratives.",
        sender: 'bot' as const,
        timestamp: new Date()
      },
      {
        id: '3',
        text: "Comment puis-je vous aider aujourd'hui ?",
        sender: 'bot' as const,
        timestamp: new Date()
      }
    ];
    
    setMessages(welcomeMessages);
  }, [currentUser]);

  // Autorise le scroll vers le bas à chaque nouveau message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Génère des réponses en fonction des mots clés dans la question
  const generateResponse = (userMessage: string): Promise<string> => {
    return new Promise((resolve) => {
      // Simulation d'un délai réseau
      setTimeout(() => {
        const lowerCaseMessage = userMessage.toLowerCase();
        
        // Réponses relatives aux voyages et billets d'avion
        if (lowerCaseMessage.includes('billet') || 
            lowerCaseMessage.includes('avion') || 
            lowerCaseMessage.includes('vol') || 
            lowerCaseMessage.includes('voyage')) {
          resolve("Notre service de réservation de billets d'avion sera bientôt disponible ! Pour l'instant, je peux vous recommander des sites comme SkyScanner, Kayak ou les sites des compagnies aériennes directes comme Air France pour les trajets vers la France. Pour les étudiants, des réductions spéciales sont souvent disponibles.");
        } 
        // Réponses relatives au logement
        else if (lowerCaseMessage.includes('logement') || 
                lowerCaseMessage.includes('appartement') || 
                lowerCaseMessage.includes('loger') || 
                lowerCaseMessage.includes('résidence') ||
                lowerCaseMessage.includes('hotel')) {
          resolve("Pour votre logement à Rouen, plusieurs options s'offrent à vous : les résidences étudiantes du CROUS, les résidences privées, ou la colocation. L'ESIGELEC dispose également d'un service d'aide au logement qui peut vous accompagner dans vos recherches. Souhaitez-vous des informations spécifiques sur l'une de ces options ?");
        } 
        // Réponses relatives à la planification
        else if (lowerCaseMessage.includes('planifier') || 
                lowerCaseMessage.includes('planning') || 
                lowerCaseMessage.includes('calendrier') || 
                lowerCaseMessage.includes('organiser') ||
                lowerCaseMessage.includes('plan')) {
          resolve("Pour planifier votre voyage, je vous recommande de suivre ces étapes :\n\n1. Vérifiez les dates de rentrée et d'inscription à l'ESIGELEC\n2. Réservez votre billet d'avion 2-3 mois à l'avance pour de meilleurs tarifs\n3. Trouvez un logement temporaire pour les premiers jours si nécessaire\n4. Préparez tous vos documents administratifs requis\n5. Établissez un budget pour les premiers mois\n\nSouhaitez-vous un guide plus détaillé pour l'une de ces étapes ?");
        }
        // Réponses relatives aux documents administratifs
        else if (lowerCaseMessage.includes('document') || 
                lowerCaseMessage.includes('papier') || 
                lowerCaseMessage.includes('visa') || 
                lowerCaseMessage.includes('passeport') ||
                lowerCaseMessage.includes('administratif')) {
          resolve("Pour votre arrivée en France, vous aurez besoin des documents suivants :\n\n• Passeport valide\n• Visa étudiant ou titre de séjour\n• Lettre d'admission de l'ESIGELEC\n• Justificatif de ressources financières\n• Acte de naissance avec traduction assermentée\n• Attestation d'assurance\n• Diplômes et relevés de notes\n\nJe peux vous détailler la procédure pour chacun de ces documents si vous le souhaitez.");
        }
        // Réponses relatives à l'école
        else if (lowerCaseMessage.includes('esigelec') || 
                lowerCaseMessage.includes('école') || 
                lowerCaseMessage.includes('formation') || 
                lowerCaseMessage.includes('cours') ||
                lowerCaseMessage.includes('étude')) {
          resolve("L'ESIGELEC est une grande école d'ingénieurs située à Rouen, en Normandie. Elle propose un cursus d'ingénieur en 5 ans avec 15 dominantes différentes dans le domaine des technologies de l'information, de l'électronique, et des systèmes embarqués. L'école possède un campus moderne avec des laboratoires bien équipés et entretient de nombreux partenariats avec des entreprises. Avez-vous des questions sur un aspect particulier de l'école ?");
        }
        // Réponse par défaut
        else {
          resolve("Je n'ai pas toutes les informations sur ce sujet précis pour le moment, mais je continue d'apprendre ! Pourriez-vous reformuler votre question ou choisir un autre sujet comme les voyages, le logement, ou les démarches administratives ? Vous pouvez également contacter directement le service international de l'ESIGELEC pour des informations plus précises.");
        }
      }, 1500); // Délai simulant le temps de réponse de l'IA
    });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    // Ajouter le message de l'utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    
    // Générer et ajouter la réponse du bot
    try {
      const botResponse = await generateResponse(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Désolé, j'ai rencontré une erreur en traitant votre demande. Veuillez réessayer.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsTyping(false);
      // Focus sur l'input après l'envoi
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getSuggestions = () => {
    const suggestions = [
      { text: "Comment réserver un billet d'avion ?", icon: <Plane className="w-4 h-4" /> },
      { text: "Options de logement à Rouen", icon: <Home className="w-4 h-4" /> },
      { text: "Planning de préparation", icon: <Calendar className="w-4 h-4" /> },
      { text: "Documents nécessaires", icon: <FileText className="w-4 h-4" /> },
      { text: "À propos de l'ESIGELEC", icon: <Map className="w-4 h-4" /> }
    ];
    
    return suggestions;
  };

  const handleSuggestionClick = (text: string) => {
    setInputMessage(text);
    // Permet un petit délai avant d'envoyer pour que l'utilisateur voie le message apparaître dans l'input
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="mr-4 text-blue-100 hover:text-white transition-colors flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Retour</span>
            </button>
            <div className="flex items-center">
              <Bot className="w-6 h-6 mr-2 text-blue-200" />
              <h1 className="text-xl font-bold">EsiBot - Assistant IA</h1>
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                Prototype
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/help')} 
            className="text-blue-100 hover:text-white transition-colors flex items-center text-sm"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            <span>Aide</span>
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg shadow-md p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                    message.sender === 'user' ? 'bg-blue-100 ml-2 mr-0' : 'bg-blue-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Suggestions */}
        <div className="mb-4 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {getSuggestions().map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="flex items-center whitespace-nowrap px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm text-blue-800 hover:bg-blue-50 transition-colors shadow-sm"
              >
                {suggestion.icon}
                <span className="ml-1.5">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Input */}
        <div className="flex items-center bg-white rounded-lg shadow-md overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-3 focus:outline-none"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={inputMessage.trim() === '' || isTyping}
            className={`p-3 ${
              inputMessage.trim() === '' || isTyping
                ? 'text-gray-400 bg-gray-100'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Ce chatbot est un prototype à des fins de démonstration uniquement.</p>
          <p>Les réponses sont pré-programmées et ne représentent pas une véritable IA.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatAI;

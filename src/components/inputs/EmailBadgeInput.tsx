import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EmailBadge {
  email: string;
  id: string;
}

interface EmailBadgeInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const EmailBadgeInput: React.FC<EmailBadgeInputProps> = ({
  emails,
  onChange,
  placeholder = "Ajouter un email...",
  disabled = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [badges, setBadges] = useState<EmailBadge[]>(
    emails.map(email => ({ email, id: Math.random().toString(36).substr(2, 9) }))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchroniser les badges avec les emails props
  useEffect(() => {
    setBadges(emails.map(email => ({ email, id: Math.random().toString(36).substr(2, 9) })));
  }, [emails]);

  // Valider un email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Ajouter un email
  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      alert(`"${trimmedEmail}" n'est pas une adresse email valide`);
      return;
    }

    if (emails.includes(trimmedEmail)) {
      alert(`"${trimmedEmail}" est déjà dans la liste`);
      return;
    }

    const newEmails = [...emails, trimmedEmail];
    onChange(newEmails);
    setInputValue('');
  };

  // Supprimer un email
  const removeEmail = (emailToRemove: string) => {
    const newEmails = emails.filter(email => email !== emailToRemove);
    onChange(newEmails);
  };

  // Gérer les touches du clavier
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && emails.length > 0) {
      // Supprimer le dernier email si input vide et backspace
      removeEmail(emails[emails.length - 1]);
    } else if (e.key === 'Escape') {
      setInputValue('');
    }
  };

  // Gérer le collage
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Extraire les emails du texte collé
    const pastedEmails = pastedText
      .split(/[,;\s]+/)
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email));

    if (pastedEmails.length > 0) {
      // Filtrer les doublons
      const uniqueEmails = pastedEmails.filter(email => !emails.includes(email));
      if (uniqueEmails.length > 0) {
        const newEmails = [...emails, ...uniqueEmails];
        onChange(newEmails);
      }
    }
  };

  return (
    <div className={`border border-gray-300 rounded-md shadow-sm focus-within:ring-blue-500 focus-within:border-blue-500 ${disabled ? 'bg-gray-100' : 'bg-white'} ${className}`}>
      <div className="flex flex-wrap items-center p-2 gap-2 min-h-[42px]">
        {/* Afficher les badges d'emails */}
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            <span className="truncate max-w-[200px]" title={badge.email}>
              {badge.email}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(badge.email)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                title="Supprimer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        
        {/* Champ de saisie */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={emails.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            disabled={disabled}
          />
        )}
        
        {/* Indicateur quand désactivé */}
        {disabled && emails.length === 0 && (
          <span className="text-gray-500 text-sm">Aucun destinataire</span>
        )}
      </div>
      
      {/* Texte d'aide */}
      <div className="px-2 pb-1">
        <p className="text-xs text-gray-500">
          Appuyez sur Entrée ou , pour ajouter un email. Vous pouvez coller plusieurs emails d'un coup.
        </p>
      </div>
    </div>
  );
};

export default EmailBadgeInput;

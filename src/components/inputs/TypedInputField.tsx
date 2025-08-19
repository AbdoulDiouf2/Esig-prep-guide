import React, { useState, useEffect, ChangeEvent } from 'react';
import { InputFieldType } from '../../contexts/ContentContext';
import { TypedValue } from '../../services/subsectionDataService';

// Fonctions utilitaires pour les dates
const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  
  // Format YYYY-MM-DD pour les champs date HTML
  return date.toISOString().split('T')[0];
};

const formatDateTimeForInput = (date: Date | null): string => {
  if (!date) return '';
  
  // Format YYYY-MM-DDThh:mm pour les champs datetime-local HTML
  // Attention: les secondes et millisecondes sont supprimées car les champs datetime-local ne les acceptent généralement pas
  return date.toISOString().slice(0, 16);
};

// Définir l'interface FieldMetadata localement car elle n'est pas encore exportée par ContentContext
interface FieldMetadata {
  options?: string[];
}

interface TypedInputFieldProps {
  id: string;
  label?: string;
  fieldType: InputFieldType;
  value: TypedValue | undefined;
  onChangeTyped?: (id: string, value: TypedValue) => void;
  onChange: (id: string, value: TypedValue) => void;
  onBlur?: () => void;
  required?: boolean;
  fieldMetadata?: FieldMetadata;
}

/**
 * Composant d'entrée intelligent qui s'adapte au type de données attendu
 */
const TypedInputField: React.FC<TypedInputFieldProps> = ({
  id,
  label,
  fieldType,
  value,
  onChange,
  onChangeTyped,
  onBlur,
  required = false,
  fieldMetadata,
}) => {
  // États locaux pour permettre une édition fluide sans validation immédiate
  const [localValue, setLocalValue] = useState<string>('');
  const [booleanValue, setBooleanValue] = useState<boolean>(false);
  const [dateValue, setDateValue] = useState<string>('');
  const [dateTimeValue, setDateTimeValue] = useState<string>('');

  // Synchroniser l'état local avec la valeur externe
  useEffect(() => {
    // La prop `value` est la source de vérité. 
    // L'état local est mis à jour en fonction de cette prop.
    if (fieldType === 'boolean') {
      setBooleanValue(Boolean(value));
    } else if (fieldType === 'date' && value instanceof Date) {
      const formattedDate = formatDateForInput(value);
      setDateValue(formattedDate);
    } else if (fieldType === 'datetime' && value instanceof Date) {
      const formattedDateTime = formatDateTimeForInput(value);
      setDateTimeValue(formattedDateTime);
    } else {
      // Pour les autres types (select, text, number...), on met à jour la valeur locale.
      // Si la valeur est null ou undefined, on la remplace par une chaîne vide.
      setLocalValue(value ? String(value) : '');
    }
  }, [value, fieldType]);

  const handleBooleanChange = (newValue: boolean) => {
    setBooleanValue(newValue); // Mettre à jour l'état local
    onChange(id, newValue); // Propager la valeur au parent
  };

  const handleDateChange = (newValue: string) => {
    setDateValue(newValue);
    
    // Log pour debug
    console.log(`Date modifiée dans le champ ${id}:`, newValue);
    
    if (newValue === '') {
      // Envoyer null si la date est effacée
      onChange(id, null);
      console.log(`Date effacée dans le champ ${id}`);
    } else {
      try {
        // Créer un objet Date avec la valeur (format YYYY-MM-DD)
        const dateObj = new Date(newValue);
        console.log(`Nouvel objet Date créé pour ${id}:`, dateObj.toISOString());
        onChange(id, dateObj);
      } catch (error) {
        console.error(`Erreur lors de la création de l'objet Date pour ${id}:`, error);
        // En cas d'erreur, ne pas modifier la valeur existante
      }
    }
  };

  const handleDateTimeChange = (newValue: string) => {
    setDateTimeValue(newValue);
    
    // Log pour debug
    console.log(`Date et heure modifiées dans le champ ${id}:`, newValue);
    
    if (newValue === '') {
      // Envoyer null si la date est effacée
      onChange(id, null);
      console.log(`Date et heure effacées dans le champ ${id}`);
    } else {
      try {
        // Créer un objet Date avec la valeur (format YYYY-MM-DDThh:mm)
        const dateObj = new Date(newValue);
        console.log(`Nouvel objet DateTime créé pour ${id}:`, dateObj.toISOString());
        onChange(id, dateObj);
      } catch (error) {
        console.error(`Erreur lors de la création de l'objet DateTime pour ${id}:`, error);
        // En cas d'erreur, ne pas modifier la valeur existante
      }
    }
  };

  const handleNumberChange = (newValue: string) => {
    onChange(id, Number(newValue));
  };

  const handleTextChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  const handleBlur = () => {
    // Convertir et sauvegarder la valeur au format approprié lors de la perte de focus
    let typedValue: TypedValue = localValue;

    if ((fieldType === 'select' || fieldType === 'airport') && localValue === '') {
      typedValue = null;
    }
    
    onChange(id, typedValue);
    
    if (onBlur) {
      onBlur();
    }
  };

  // Rendu différent selon le type de champ
  // Rendu du champ selon son type
  const renderField = () => {
    switch (fieldType) {
      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={booleanValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleBooleanChange(e.target.checked)}
              />
              <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            {label && <span className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</span>}
          </div>
        );
      
      case 'date':
        return (
          <input
            type="date"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={dateValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleDateChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'datetime':
        return (
          <input
            type="datetime-local"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={dateTimeValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleDateTimeChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue !== null && localValue !== undefined ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleNumberChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'select': {
        // Utilisation d'un bloc pour permettre la déclaration de variables locales
        const options = fieldMetadata?.options || [];
        
        return (
          <select
            className="form-select w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue !== null && localValue !== undefined ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          >
            <option value="">Sélectionnez une option</option>
            {options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      }
      
      case 'airport': {
        // On utilise le même rendu que 'select' mais avec une liste d'aéroports prédéfinie
        const airports = [
          'CDG - Paris Charles de Gaulle', 
          'ORY - Paris Orly',
          'LYS - Lyon Saint-Exupéry',
          'NCE - Nice Côte d\'Azur',
          'MRS - Marseille Provence',
          'TLS - Toulouse Blagnac',
          'BSL - Bâle-Mulhouse-Fribourg',
          'NTE - Nantes Atlantique',
          'BDX - Bordeaux-Mérignac',
          'LIL - Lille Lesquin'
        ];
        
        return (
          <select
            className="form-select w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue !== null && localValue !== undefined ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          >
            <option value="">Sélectionnez un aéroport</option>
            {airports.map((airport, index) => (
              <option key={index} value={airport}>{airport}</option>
            ))}
          </select>
        );
      }
      
      case 'longtext':
        return (
          <textarea
            className="form-textarea w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
            rows={4}
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'url':
        return (
          <input
            type="url"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
      
      case 'text':
      default:
        return (
          <input
            type="text"
            className="form-input w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={localValue ? String(localValue) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleTextChange(e.target.value)}
            onBlur={handleBlur}
          />
        );
    }
  };

  // Fonction de validation - confirme et sauvegarde la valeur actuelle
  const handleValidate = () => {
    // Appliquer les modifications locales d'abord
    handleBlur();
    
    // Pour les types date et datetime, sauvegarde explicite comme valeur typée
    if (fieldType === 'date' || fieldType === 'datetime') {
      // Créer un objet Date valide pour Firestore
      let dateObj = null;
      
      if (fieldType === 'date' && dateValue) {
        dateObj = new Date(dateValue);
      } else if (fieldType === 'datetime' && dateTimeValue) {
        dateObj = new Date(dateTimeValue);
      }
      
      if (dateObj && !isNaN(dateObj.getTime()) && onChangeTyped) {
        // Si onChangeTyped est fourni, l'utiliser pour sauvegarder la date
        onChangeTyped(id, dateObj);
        console.log(`Valeur typée sauvegardée pour ${id}: ${dateObj.toISOString()}`); 
      }
    } else if (fieldType === 'boolean' && onChangeTyped) {
      // Pour les booléens, sauvegarder comme valeur typée
      onChangeTyped(id, booleanValue);
    } else if (fieldType === 'number' && onChangeTyped) {
      // Pour les nombres, convertir et sauvegarder comme valeur typée
      const numValue = parseFloat(localValue);
      if (!isNaN(numValue)) {
        onChangeTyped(id, numValue);
      }
    }
    
    // Log de la validation
    console.log(`Valeur validée pour ${id}: ${localValue || dateValue || dateTimeValue}`);
  };

  // Fonction de réinitialisation - efface la valeur actuelle
  const handleClear = () => {
    if (fieldType === 'boolean') {
      setBooleanValue(false);
      onChange(id, false);
    } else if (fieldType === 'date') {
      setDateValue('');
      onChange(id, null);
    } else if (fieldType === 'datetime') {
      setDateTimeValue('');
      onChange(id, null);
    } else if (fieldType === 'number') {
      setLocalValue('');
      onChange(id, 0);
    } else {
      setLocalValue('');
      onChange(id, '');
    }
    console.log(`Valeur effacée pour ${id}`);
  };

  return (
    <div className="mb-4">
      {label && fieldType !== 'boolean' && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-center">
        <div className="flex-grow">
          {renderField()}
        </div>
        <div className="flex ml-2">
          {/* Bouton de validation (V) - version discrète */}
          <button 
            type="button" 
            onClick={handleValidate}
            className="px-1 text-xs text-gray-600 hover:text-green-700 focus:outline-none mr-1"
            title="Valider la valeur"
          >
            ✓
          </button>
          
          {/* Bouton de suppression (X) - version discrète */}
          <button 
            type="button" 
            onClick={handleClear}
            className="px-1 text-xs text-gray-600 hover:text-red-700 focus:outline-none"
            title="Effacer la valeur"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypedInputField;

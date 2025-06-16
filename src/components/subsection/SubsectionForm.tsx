import React, { useCallback, useState, useEffect } from 'react';
import { SubSection } from '../../contexts/ContentContext';
import SubsectionItemInput from './SubsectionItemInput';
import { TypedValue } from '../../services/subsectionDataService';
import { Check, X } from 'lucide-react';

interface SubsectionFormProps {
  subSection: SubSection;
  checkedItems: Record<string, boolean>;
  inputValues: Record<string, string>;
  typedValues?: Record<string, TypedValue>;
  onCheckChange: (itemId: string) => void;
  onInputChange: (itemId: string, value: string) => void;
  onTypedValueChange?: (itemId: string, value: TypedValue) => void;
}

/**
 * Composant qui gère l'affichage et l'interaction avec une sous-section
 */
const SubsectionForm: React.FC<SubsectionFormProps> = ({
  subSection,
  checkedItems,
  inputValues,
  typedValues = {},
  onCheckChange,
  onInputChange,
  onTypedValueChange
}) => {
  // État local pour les valeurs typées
  const [localTypedValues, setLocalTypedValues] = useState<Record<string, TypedValue>>(typedValues);

  // Mettre à jour l'état local quand les valeurs externes changent
  useEffect(() => {
    setLocalTypedValues(typedValues);
  }, [typedValues]);

  // Gérer le changement de valeur typée
  const handleTypedValueChange = useCallback((itemId: string, value: TypedValue) => {
    const updatedValues = {
      ...localTypedValues,
      [itemId]: value
    };
    setLocalTypedValues(updatedValues);
    
    // Propager le changement vers le parent si le callback est fourni
    if (onTypedValueChange) {
      onTypedValueChange(itemId, value);
    }
  }, [localTypedValues, onTypedValueChange]);

  // Effacer la valeur d'un champ
  const clearInputField = useCallback((itemId: string) => {
    // Mettre à jour la valeur standard
    onInputChange(itemId, '');
    
    // Mettre à jour la valeur typée
    const updatedValues = { ...localTypedValues };
    delete updatedValues[itemId];
    setLocalTypedValues(updatedValues);
  }, [localTypedValues, onInputChange]);

  // Rendre le contenu selon le type de sous-section
  if (subSection.type === 'bulletList') {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {subSection.items.map(item => (
          <li key={item.id} className="text-sm text-gray-700">{item.content}</li>
        ))}
      </ul>
    );
  }

  if (subSection.type === 'checkList') {
    return (
      <div className="space-y-2">
        {subSection.items.map(item => (
          <div key={item.id} className="flex items-start">
            <input
              type="checkbox"
              id={`check-${item.id}`}
              className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={checkedItems[item.id] || false}
              onChange={() => onCheckChange(item.id)}
            />
            <label htmlFor={`check-${item.id}`} className="ml-2 block text-sm text-gray-700">
              {item.content}
            </label>
          </div>
        ))}
      </div>
    );
  }

  if (subSection.type === 'inputField') {
    return (
      <div className="space-y-2">
        {subSection.items.map(item => (
          <div key={item.id} className="group relative">
            {item.fieldType ? (
              <SubsectionItemInput
                item={item}
                value={inputValues[item.id] || ''}
                typedValue={localTypedValues[item.id]}
                onChange={onInputChange}
                onChangeTyped={handleTypedValueChange}
              />
            ) : (
              // Interface standard pour la compatibilité avec le système existant
              <div className="flex items-center bg-white overflow-hidden rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm hover:shadow">
                <label 
                  htmlFor={`input-${item.id}`} 
                  className="flex-shrink-0 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border-r border-gray-200 select-none">
                  {item.content}
                </label>
                <input
                  type="text"
                  id={`input-${item.id}`}
                  className="block w-full flex-1 px-3 py-2 border-0 focus:ring-0 focus:outline-none text-sm text-gray-700 placeholder-gray-400 transition-colors duration-300"
                  placeholder="Entrez votre information"
                  value={inputValues[item.id] || ''}
                  onChange={(e) => onInputChange(item.id, e.target.value)}
                />
                <div className="flex">
                  {inputValues[item.id] && (
                    <>
                      <button 
                        className="p-2 text-green-500 hover:text-green-700 focus:outline-none" 
                        type="button"
                        aria-label="Valider"
                        title="Valider"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none" 
                        onClick={() => clearInputField(item.id)}
                        type="button"
                        aria-label="Effacer"
                        title="Effacer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default SubsectionForm;

import React, { useEffect, useState } from 'react';
import { SubSectionItem } from '../../contexts/ContentContext';
import TypedInputField from '../inputs/TypedInputField';
import { TypedValue, convertStringToTypedValue } from '../../services/subsectionDataService';

interface SubsectionItemInputProps {
  item: SubSectionItem;
  value?: string;
  typedValue?: TypedValue;
  onChange: (id: string, value: string) => void;
  onChangeTyped?: (id: string, value: TypedValue) => void;
}

/**
 * Composant pour la saisie des données d'un élément de sous-section
 * Supporte à la fois les valeurs textuelles standard (compatibilité) et les valeurs typées
 */
const SubsectionItemInput: React.FC<SubsectionItemInputProps> = ({
  item,
  value = '',
  typedValue,
  onChange,
  onChangeTyped
}) => {
  // État local pour gérer la valeur d'entrée
  const [inputValue, setInputValue] = useState<string>(value);

  // Mettre à jour l'état local quand la valeur externe change
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Gérer le changement de valeur
  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(item.id, newValue);
  };

  // Gérer le changement de valeur typée
  const handleTypedChange = (id: string, newTypedValue: TypedValue) => {
    // Si nous avons un gestionnaire pour les valeurs typées, on l'utilise
    if (onChangeTyped) {
      onChangeTyped(id, newTypedValue);
    }
    
    // On met également à jour la valeur string pour la compatibilité avec les composants existants
    if (item.fieldType) {
      const stringValue = String(newTypedValue);
      onChange(id, stringValue);
    }
  };

  // Si l'élément a un type de champ défini et que nous avons un gestionnaire de valeurs typées, 
  // utiliser TypedInputField
  if (item.fieldType && onChangeTyped) {
    // Déterminer la valeur à utiliser pour le champ typé
    const actualTypedValue = typedValue !== undefined 
      ? typedValue 
      : convertStringToTypedValue(inputValue, item.fieldType);

    return (
      <TypedInputField
        id={item.id}
        label={item.content}
        fieldType={item.fieldType}
        value={actualTypedValue}
        onChange={handleTypedChange}
        onChangeTyped={onChangeTyped}
        fieldMetadata={{ options: item.options }}
      />
    );
  }

  // Sinon, on revient à un input standard pour la compatibilité
  return (
    <div className="mb-3">
      <label htmlFor={item.id} className="form-label">
        {item.content}
      </label>
      <input
        type="text"
        className="form-control"
        id={item.id}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`Entrez ${item.content.toLowerCase()}`}
      />
    </div>
  );
};

export default SubsectionItemInput;

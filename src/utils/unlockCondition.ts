import { SubSection } from '../contexts/ContentContext';
import { TypedValue } from '../services/subsectionDataService';

// Une sous-section est "complète" quand tous ses items interactifs sont renseignés.
// bulletList n'est jamais interactive => toujours considérée complète.
export function isSubSectionComplete(
  subSection: SubSection,
  checkedItems: Record<string, boolean>,
  typedValues: Record<string, TypedValue>,
  inputValues: Record<string, string>
): boolean {
  if (subSection.type === 'bulletList' || subSection.items.length === 0) return true;

  return subSection.items.every(item => {
    if (subSection.type === 'checkList') {
      return !!checkedItems[item.id];
    }
    // inputField
    const typed = typedValues[item.id];
    if (typed !== undefined && typed !== null && String(typed).trim() !== '') return true;
    return !!(inputValues[item.id] && inputValues[item.id].trim() !== '');
  });
}

// Détermine si une sous-section est débloquée pour l'utilisateur courant :
// débloquée si elle n'a pas de condition, ou si la sous-section déclencheuse référencée
// est entièrement complétée. `allSubSections` doit contenir toutes les sous-sections du guide
// (toutes GuideSections confondues) pour pouvoir retrouver le déclencheur.
export function isSubSectionUnlocked(
  subSection: SubSection,
  allSubSections: SubSection[],
  checkedItems: Record<string, boolean>,
  typedValues: Record<string, TypedValue>,
  inputValues: Record<string, string>
): boolean {
  const cond = subSection.unlockCondition;
  if (!cond) return true;

  const trigger = allSubSections.find(s => s.id === cond.subSectionId);
  if (!trigger) return false;

  return isSubSectionComplete(trigger, checkedItems, typedValues, inputValues);
}

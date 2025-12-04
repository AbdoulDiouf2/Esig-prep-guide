import React, { useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  component: ReactNode;
  validation?: () => boolean | Promise<boolean>;
}

interface MultiStepFormProps {
  steps: Step[];
  onComplete: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel?: () => void;
  currentStepIndex?: number;
  onStepChange?: (stepIndex: number) => void;
}

/**
 * Composant de formulaire multi-étapes réutilisable
 * Gère la navigation, la progression et la validation
 */
export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  onComplete,
  onCancel,
  currentStepIndex: externalStepIndex,
  onStepChange,
}) => {
  const [internalStepIndex, setInternalStepIndex] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Utiliser l'index externe si fourni, sinon utiliser l'index interne
  const currentStepIndex = externalStepIndex !== undefined ? externalStepIndex : internalStepIndex;
  const setCurrentStepIndex = onStepChange || setInternalStepIndex;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  /**
   * Aller à l'étape suivante
   */
  const handleNext = async () => {
    // Valider l'étape actuelle si une fonction de validation est fournie
    if (currentStep.validation) {
      setIsValidating(true);
      try {
        const isValid = await currentStep.validation();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error('Erreur de validation:', error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    if (isLastStep) {
      // Dernière étape : appeler onComplete
      await onComplete({});
    } else {
      // Passer à l'étape suivante
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  /**
   * Revenir à l'étape précédente
   */
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  /**
   * Aller directement à une étape spécifique
   */
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Indicateur de progression */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Étape {currentStepIndex + 1} sur {steps.length}
          </span>
          <span className="text-sm text-gray-500">{currentStep.title}</span>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Indicateurs d'étapes */}
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              disabled={index > currentStepIndex}
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all ${
                index < currentStepIndex
                  ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                  : index === currentStepIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu de l'étape actuelle */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentStep.title}</h2>
        <div>{currentStep.component}</div>
      </div>

      {/* Boutons de navigation */}
      <div className="flex justify-between items-center">
        <div>
          {!isFirstStep && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isValidating}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isValidating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isValidating}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Validation...
              </>
            ) : isLastStep ? (
              'Créer mon compte'
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiStepForm;

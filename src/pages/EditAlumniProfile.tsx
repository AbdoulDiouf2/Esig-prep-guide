import React from 'react';
import CompleteAlumniProfile from './CompleteAlumniProfile';

// La page d'édition utilise le même composant que la page de complétion
// car la logique est identique
const EditAlumniProfile: React.FC = () => {
  return <CompleteAlumniProfile />;
};

export default EditAlumniProfile;

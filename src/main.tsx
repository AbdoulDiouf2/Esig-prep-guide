import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import emailjs from '@emailjs/browser'

// Initialisation d'EmailJS avec votre clé publique
// Cette valeur doit correspondre à la PUBLIC_KEY dans NotificationService.ts
// Nous utilisons une valeur temporaire ici - vous devrez utiliser la même clé que dans NotificationService.ts
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

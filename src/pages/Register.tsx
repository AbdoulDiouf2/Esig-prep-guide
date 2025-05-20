import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch  {
      setError("Erreur lors de l'inscription avec Google");
      console.error();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, name);
      navigate('/dashboard');
    } catch {
      setError('Erreur lors de la création du compte');
      console.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-700 flex items-center justify-center shadow-sm">
          <div className="text-white font-bold text-lg">E</div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Créez votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            connectez-vous avec un compte existant
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
              <div className="flex">
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 mb-6 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.3 3.4-4.6 5.9-8.3 5.9-5 0-9-4-9-9s4-9 9-9c2.2 0 4.2.8 5.8 2.1l6.6-6.6C36.3 8.1 30.5 6 24 6 12.9 6 4 14.9 4 26s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.5-.4-3.7z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C15.5 16.4 19.5 14 24 14c2.2 0 4.2.8 5.8 2.1l6.6-6.6C36.3 8.1 30.5 6 24 6c-7.5 0-13.9 4.1-17.7 10.7z"/><path fill="#FBBC05" d="M24 44c6.5 0 12.1-2.1 16.1-5.8l-7.4-6c-2.1 1.4-4.7 2.2-7.7 2.2-3.7 0-7-2.5-8.3-5.9H6.3C10.1 39.9 16.5 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-.5 1.4-1.3 2.7-2.4 3.7l7.4 6C41.7 40.2 44 33.7 44 26c0-1.3-.1-2.5-.4-3.7z"/></g></svg>
            S'inscrire avec Google
          </button>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1">
                <div className="relative">
  <input
    id="password"
    name="password"
    type={showPassword ? "text" : "password"}
    autoComplete="new-password"
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
  />
  <button
    type="button"
    tabIndex={-1}
    onClick={() => setShowPassword((v) => !v)}
    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-700 focus:outline-none"
    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
  >
    {showPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125 4.575m-2.53 2.53A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125 4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125 4.575m-2.53 2.53A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125 4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
  </button>
</div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmez le mot de passe
              </label>
              <div className="mt-1">
                <div className="relative">
  <input
    id="confirmPassword"
    name="confirmPassword"
    type={showConfirmPassword ? "text" : "password"}
    autoComplete="new-password"
    required
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
  />
  <button
    type="button"
    tabIndex={-1}
    onClick={() => setShowConfirmPassword((v) => !v)}
    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-blue-700 focus:outline-none"
    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
  >
    {showConfirmPassword ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125-4.575m-2.53 2.53A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125-4.575m-2.53 2.53A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.402-3.216 1.125-4.575m2.53-2.53A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.402 3.216-1.125-4.575" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
  </button>
</div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                J'accepte les{' '}
                <Link to="/legal/CGU" className="font-medium text-blue-600 hover:text-blue-500">
                  conditions d'utilisation
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Création en cours...' : 'Créer un compte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
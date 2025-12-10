import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGithub } = useAuth();

  // For demo purposes, pre-populate with admin credentials
  React.useEffect(() => {
    // Create default admin if not exists
    if (!localStorage.getItem('user_admin@example.com')) {
      localStorage.setItem('user_admin@example.com', 'adminpassword');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/applications');
    } catch (err: unknown) {
      setError('Identifiants invalides. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/applications');
    } catch (err: unknown) {
      let message = "Erreur lors de la connexion avec Google.";
      if (err && typeof err === 'object' && 'message' in err) {
        message += `\n${(err as { message: string }).message}`;
      }
      setError(message);
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Connexion GitHub
  const handleGithubLogin = async () => {
    setError('');
    setGithubLoading(true);
    try {
      await loginWithGithub();
      navigate('/applications');
    } catch (err: unknown) {
      let message = "Erreur lors de la connexion avec GitHub.";
      if (err && typeof err === 'object' && 'message' in err) {
        message += `\n${(err as { message: string }).message}`;
      }
      setError(message);
      console.error(err);
    } finally {
      setGithubLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-8 sm:h-10 md:h-12 w-auto flex items-center justify-center">
          <img src="/cps-connect-alumni-fond-blanc.png" alt="Logo" className="h-full w-auto object-contain" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connectez-vous à votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            créez un nouveau compte
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
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 ${googleLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.3 3.4-4.6 5.9-8.3 5.9-5 0-9-4-9-9s4-9 9-9c2.2 0 4.2.8 5.8 2.1l6.6-6.6C36.3 8.1 30.5 6 24 6 12.9 6 4 14.9 4 26s8.9 20 20 20c11.1 0 20-8.9 20-20 0-1.3-.1-2.5-.4-3.7z"/><path fill="#34A853" d="M6.3 14.7l6.6 4.8C15.5 16.4 19.5 14 24 14c2.2 0 4.2.8 5.8 2.1l6.6-6.6C36.3 8.1 30.5 6 24 6c-7.5 0-13.9 4.1-17.7 10.7z"/><path fill="#FBBC05" d="M24 44c6.5 0 12.1-2.1 16.1-5.8l-7.4-6c-2.1 1.4-4.7 2.2-7.7 2.2-3.7 0-7-2.5-8.3-5.9H6.3C10.1 39.9 16.5 44 24 44z"/><path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-.5 1.4-1.3 2.7-2.4 3.7l7.4 6C41.7 40.2 44 33.7 44 26c0-1.3-.1-2.5-.4-3.7z"/></g></svg>
              {googleLoading ? 'Connexion Google...' : 'Se connecter avec Google'}
            </button>
            
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={githubLoading}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 ${githubLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              {githubLoading ? 'Connexion GitHub...' : 'Se connecter avec GitHub'}
            </button>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
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
    autoComplete="current-password"
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

            <div className="flex items-center justify-between">
              

              <div className="text-sm">
                <Link to="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </div>
          </form>

          
        </div>
      </div>
    </div>
  );
};

export default Login;
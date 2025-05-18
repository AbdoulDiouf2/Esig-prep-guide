import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Mock register function
  const register = async (email: string, password: string, name: string) => {
    try {
      // For demo purposes, we'll create a mock user
      // In a real app, this would call an API or Firebase
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        isAdmin: email.includes('admin') // Simple way to make admin accounts for demo
      };
      
      // Store user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setCurrentUser(newUser);
      
      // In a real app, you'd also store/hash the password securely
      localStorage.setItem(`user_${email}`, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Mock login function
  const login = async (email: string, password: string) => {
    try {
      // For demo purposes only
      // In a real app, this would validate against a secure backend
      const storedPassword = localStorage.getItem(`user_${email}`);
      
      if (storedPassword === password) {
        // Check if this is the default admin
        let user: User;
        
        if (email === 'admin@example.com' && password === 'adminpassword') {
          user = {
            id: 'admin1',
            email: 'admin@example.com',
            name: 'Admin User',
            isAdmin: true
          };
        } else {
          // Try to find an existing user
          const storedUser = localStorage.getItem('currentUser');
          
          if (storedUser && JSON.parse(storedUser).email === email) {
            user = JSON.parse(storedUser);
          } else {
            // Create a basic user object
            user = {
              id: Date.now().toString(),
              email,
              name: email.split('@')[0], // Simple name from email
              isAdmin: email.includes('admin')
            };
          }
        }
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Mock logout function
  const logout = async () => {
    try {
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser?.isAdmin || false;
  };

  const value = {
    currentUser,
    loading,
    register,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
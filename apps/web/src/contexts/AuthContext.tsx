/**
 * LicitaReview - Authentication Context
 * 
 * Centralizes authentication logic using Firebase Auth and Firestore.
 * Provides user state management and authentication methods throughout the app.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { authSync, syncLogout, syncLogin } from '@/lib/auth-sync';

// Types
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  organizationName?: string;
  cnpj?: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  displayName: string;
  organizationName?: string;
  cnpj?: string;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// AuthProvider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const { displayName, email } = user;
        const userData: UserProfile = {
          uid: user.uid,
          email: email || '',
          displayName: displayName || '',
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...additionalData
        };

        await setDoc(userRef, userData);
        setUserProfile(userData);
      } else {
        setUserProfile(userSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar perfil do usuário',
        variant: 'destructive'
      });
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user);
      
      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      await createUserProfile(result.user);
      
      toast({
        title: 'Sucesso',
        description: 'Login com Google realizado com sucesso!'
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelado pelo usuário';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (email: string, password: string, userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name in Firebase Auth
      await updateProfile(result.user, {
        displayName: userData.displayName
      });

      // Create user profile in Firestore
      await createUserProfile(result.user, {
        displayName: userData.displayName,
        organizationName: userData.organizationName,
        cnpj: userData.cnpj
      });
      
      toast({
        title: 'Sucesso',
        description: 'Conta criada com sucesso!'
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
          break;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserProfile(null);

      // Notifica outras tabs sobre logout
      syncLogout();

      toast({
        title: 'Sucesso',
        description: 'Logout realizado com sucesso!'
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Load user profile from Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserProfile(userSnap.data() as UserProfile);
          } else {
            // Create profile if it doesn't exist
            await createUserProfile(user);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auth sync entre múltiplas tabs
  useEffect(() => {
    // Notifica outras tabs quando fizer login
    if (currentUser) {
      syncLogin(currentUser.uid);
    }

    // Escuta logout de outras tabs
    authSync.onLogout(() => {
      console.log('[AuthContext] Recebeu logout de outra tab');
      setCurrentUser(null);
      setUserProfile(null);
    });

    // Escuta login de outras tabs
    authSync.onLogin((userId) => {
      console.log('[AuthContext] Recebeu login de outra tab:', userId);
      // Força reload do auth state
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.uid === userId) {
          setCurrentUser(user);
        }
      });
      return () => unsubscribe();
    });

    // Responde a verificações de sessão
    authSync.onSessionCheck(() => {
      return !!currentUser;
    });

    return () => {
      // Cleanup não necessário (authSync é singleton)
    };
  }, [currentUser]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
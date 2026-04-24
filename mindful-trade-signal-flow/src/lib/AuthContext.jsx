import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { appClient } from '@/api/appClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const authRequestRef = useRef(null);
  const lastAuthCheckAtRef = useRef(0);

  const checkUserAuth = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastAuthCheckAtRef.current < 3000 && authChecked) {
      return;
    }

    if (authRequestRef.current) {
      return authRequestRef.current;
    }

    const req = (async () => {
      try {
        setIsLoadingAuth(true);
        const currentUser = await appClient.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        if (error?.status === 401 || error?.status === 403) {
          setAuthError({
            type: 'auth_required',
            message: 'Authentication required'
          });
        } else {
          console.error('User auth check failed:', error);
        }
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
        lastAuthCheckAtRef.current = Date.now();
        authRequestRef.current = null;
      }
    })();

    authRequestRef.current = req;
    return req;
  }, [authChecked]);

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      setAppPublicSettings({ mode: 'local-dev' });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    
    if (shouldRedirect) {
      await appClient.auth.logout(window.location.href);
    } else {
      await appClient.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    appClient.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      refreshUser: () => checkUserAuth({ force: true }),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

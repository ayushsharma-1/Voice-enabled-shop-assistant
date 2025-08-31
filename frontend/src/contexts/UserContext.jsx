import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storageService } from '../services/storage.js';
import { config } from '../config/env.js';

const UserContext = createContext();

const initialState = {
  currentUser: null,
  preferences: {
    theme: 'light',
    voiceEnabled: true,
    notifications: true,
    autoRefresh: true
  },
  isAuthenticated: false,
  loading: false,
  error: null
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        currentUser: action.payload,
        isAuthenticated: !!action.payload,
        error: null
      };
    
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        preferences: state.preferences // Keep preferences on logout
      };
    
    default:
      return state;
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Initialize user from storage on mount
  useEffect(() => {
    const initializeUser = () => {
      try {
        const savedUser = storageService.getCurrentUser();
        const preferences = storageService.getUserPreferences();
        
        if (savedUser) {
          dispatch({ type: 'SET_USER', payload: savedUser });
        } else {
          // Set default user if none exists
          const defaultUser = config.DEFAULT_USER;
          storageService.setCurrentUser(defaultUser);
          dispatch({ type: 'SET_USER', payload: defaultUser });
        }
        
        dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Error initializing user:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
      }
    };

    initializeUser();
  }, []);

  const setUser = (username) => {
    try {
      storageService.setCurrentUser(username);
      dispatch({ type: 'SET_USER', payload: username });
    } catch (error) {
      console.error('Error setting user:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to set user' });
    }
  };

  const updatePreferences = (newPreferences) => {
    try {
      const updatedPreferences = { ...state.preferences, ...newPreferences };
      storageService.setUserPreferences(updatedPreferences);
      dispatch({ type: 'SET_PREFERENCES', payload: newPreferences });
    } catch (error) {
      console.error('Error updating preferences:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update preferences' });
    }
  };

  const logout = () => {
    try {
      storageService.setCurrentUser(null);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error logging out:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to logout' });
    }
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    setUser,
    updatePreferences,
    logout,
    setLoading,
    setError,
    clearError
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

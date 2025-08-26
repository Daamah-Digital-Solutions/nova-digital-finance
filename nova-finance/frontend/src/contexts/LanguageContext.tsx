import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { translations, Language, TranslationKey } from '../translations';

interface LanguageState {
  language: Language;
  direction: 'ltr' | 'rtl';
}

interface LanguageAction {
  type: 'SET_LANGUAGE';
  payload: Language;
}

const initialState: LanguageState = {
  language: 'en',
  direction: 'ltr',
};

const LanguageContext = createContext<{
  state: LanguageState;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}>({
  state: initialState,
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
});

function languageReducer(state: LanguageState, action: LanguageAction): LanguageState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
        direction: action.payload === 'ar' ? 'rtl' : 'ltr',
      };
    default:
      return state;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(languageReducer, initialState);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
    } else {
      // Check browser language
      const browserLanguage = navigator.language.split('-')[0] as Language;
      if (Object.keys(translations).includes(browserLanguage)) {
        dispatch({ type: 'SET_LANGUAGE', payload: browserLanguage });
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.direction;
    document.body.className = state.direction;
    localStorage.setItem('language', state.language);
  }, [state.language, state.direction]);

  const setLanguage = (language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const t = (key: TranslationKey): string => {
    return translations[state.language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ state, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
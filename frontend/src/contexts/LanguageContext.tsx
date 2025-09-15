import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: { code: Language; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.loans': 'Loans',
    'nav.investments': 'Investments',
    'nav.documents': 'Documents',
    'nav.requests': 'Requests',
    'nav.about': 'About Us',
    'nav.features': 'Features',
    'nav.faq': 'FAQ',
    'nav.terms': 'Terms',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.view': 'View',
    'common.submit': 'Submit',
    'common.back': 'Back',
    'common.next': 'Next',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
    'auth.phoneNumber': 'Phone Number',
    'auth.login.title': 'Sign In to Nova Finance',
    'auth.register.title': 'Create Your Nova Account',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.alreadyHaveAccount': 'Already have an account?',

    // Dashboard
    'dashboard.welcome': 'Welcome back, {{name}}!',
    'dashboard.totalBalance': 'Total Balance',
    'dashboard.activeLoans': 'Active Loans',
    'dashboard.investments': 'Investments',
    'dashboard.recentActivity': 'Recent Activity',

    // Loans
    'loans.application.title': 'Loan Application',
    'loans.amount': 'Loan Amount',
    'loans.purpose': 'Purpose',
    'loans.term': 'Term',
    'loans.interestRate': 'Interest Rate',
    'loans.status': 'Status',
    'loans.payment.title': 'Make Payment',

    // Documents
    'documents.title': 'Documents',
    'documents.upload': 'Upload Document',
    'documents.sign': 'Sign Document',
    'documents.download': 'Download',
    'documents.status': 'Status',

    // Footer
    'footer.copyright': '© {{year}} Nova Finance. All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.contact': 'Contact Us',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.loans': 'Préstamos',
    'nav.investments': 'Inversiones',
    'nav.documents': 'Documentos',
    'nav.requests': 'Solicitudes',
    'nav.about': 'Acerca de',
    'nav.features': 'Características',
    'nav.faq': 'Preguntas Frecuentes',
    'nav.terms': 'Términos',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.logout': 'Cerrar Sesión',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.view': 'Ver',
    'common.submit': 'Enviar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',

    // Auth
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.firstName': 'Nombre',
    'auth.lastName': 'Apellido',
    'auth.phoneNumber': 'Número de Teléfono',
    'auth.login.title': 'Iniciar Sesión en Nova Finance',
    'auth.register.title': 'Crear Tu Cuenta Nova',
    'auth.forgotPassword': '¿Olvidaste tu Contraseña?',
    'auth.dontHaveAccount': '¿No tienes una cuenta?',
    'auth.alreadyHaveAccount': '¿Ya tienes una cuenta?',

    // Dashboard
    'dashboard.welcome': '¡Bienvenido de nuevo, {{name}}!',
    'dashboard.totalBalance': 'Balance Total',
    'dashboard.activeLoans': 'Préstamos Activos',
    'dashboard.investments': 'Inversiones',
    'dashboard.recentActivity': 'Actividad Reciente',

    // Loans
    'loans.application.title': 'Solicitud de Préstamo',
    'loans.amount': 'Cantidad del Préstamo',
    'loans.purpose': 'Propósito',
    'loans.term': 'Plazo',
    'loans.interestRate': 'Tasa de Interés',
    'loans.status': 'Estado',
    'loans.payment.title': 'Realizar Pago',

    // Documents
    'documents.title': 'Documentos',
    'documents.upload': 'Subir Documento',
    'documents.sign': 'Firmar Documento',
    'documents.download': 'Descargar',
    'documents.status': 'Estado',

    // Footer
    'footer.copyright': '© {{year}} Nova Finance. Todos los derechos reservados.',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
    'footer.contact': 'Contáctanos',
  },
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de Bord',
    'nav.loans': 'Prêts',
    'nav.investments': 'Investissements',
    'nav.documents': 'Documents',
    'nav.requests': 'Demandes',
    'nav.about': 'À Propos',
    'nav.features': 'Fonctionnalités',
    'nav.faq': 'FAQ',
    'nav.terms': 'Conditions',
    'nav.login': 'Connexion',
    'nav.register': 'S\'inscrire',
    'nav.logout': 'Déconnexion',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.view': 'Voir',
    'common.submit': 'Soumettre',
    'common.back': 'Retour',
    'common.next': 'Suivant',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Mot de Passe',
    'auth.firstName': 'Prénom',
    'auth.lastName': 'Nom de Famille',
    'auth.phoneNumber': 'Numéro de Téléphone',
    'auth.login.title': 'Se Connecter à Nova Finance',
    'auth.register.title': 'Créer Votre Compte Nova',
    'auth.forgotPassword': 'Mot de Passe Oublié?',
    'auth.dontHaveAccount': 'Vous n\'avez pas de compte?',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte?',

    // Dashboard
    'dashboard.welcome': 'Bon retour, {{name}}!',
    'dashboard.totalBalance': 'Solde Total',
    'dashboard.activeLoans': 'Prêts Actifs',
    'dashboard.investments': 'Investissements',
    'dashboard.recentActivity': 'Activité Récente',

    // Loans
    'loans.application.title': 'Demande de Prêt',
    'loans.amount': 'Montant du Prêt',
    'loans.purpose': 'Objectif',
    'loans.term': 'Durée',
    'loans.interestRate': 'Taux d\'Intérêt',
    'loans.status': 'Statut',
    'loans.payment.title': 'Effectuer un Paiement',

    // Documents
    'documents.title': 'Documents',
    'documents.upload': 'Télécharger Document',
    'documents.sign': 'Signer Document',
    'documents.download': 'Télécharger',
    'documents.status': 'Statut',

    // Footer
    'footer.copyright': '© {{year}} Nova Finance. Tous droits réservés.',
    'footer.privacy': 'Politique de Confidentialité',
    'footer.terms': 'Conditions de Service',
    'footer.contact': 'Nous Contacter',
  },
  pt: {
    // Navigation
    'nav.dashboard': 'Painel',
    'nav.loans': 'Empréstimos',
    'nav.investments': 'Investimentos',
    'nav.documents': 'Documentos',
    'nav.requests': 'Solicitações',
    'nav.about': 'Sobre Nós',
    'nav.features': 'Recursos',
    'nav.faq': 'FAQ',
    'nav.terms': 'Termos',
    'nav.login': 'Entrar',
    'nav.register': 'Registrar',
    'nav.logout': 'Sair',

    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.view': 'Ver',
    'common.submit': 'Enviar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',

    // Auth
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.firstName': 'Nome',
    'auth.lastName': 'Sobrenome',
    'auth.phoneNumber': 'Número de Telefone',
    'auth.login.title': 'Entrar no Nova Finance',
    'auth.register.title': 'Criar Sua Conta Nova',
    'auth.forgotPassword': 'Esqueceu a Senha?',
    'auth.dontHaveAccount': 'Não tem uma conta?',
    'auth.alreadyHaveAccount': 'Já tem uma conta?',

    // Dashboard
    'dashboard.welcome': 'Bem-vindo de volta, {{name}}!',
    'dashboard.totalBalance': 'Saldo Total',
    'dashboard.activeLoans': 'Empréstimos Ativos',
    'dashboard.investments': 'Investimentos',
    'dashboard.recentActivity': 'Atividade Recente',

    // Loans
    'loans.application.title': 'Solicitação de Empréstimo',
    'loans.amount': 'Valor do Empréstimo',
    'loans.purpose': 'Propósito',
    'loans.term': 'Prazo',
    'loans.interestRate': 'Taxa de Juros',
    'loans.status': 'Status',
    'loans.payment.title': 'Fazer Pagamento',

    // Documents
    'documents.title': 'Documentos',
    'documents.upload': 'Carregar Documento',
    'documents.sign': 'Assinar Documento',
    'documents.download': 'Baixar',
    'documents.status': 'Status',

    // Footer
    'footer.copyright': '© {{year}} Nova Finance. Todos os direitos reservados.',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Serviço',
    'footer.contact': 'Fale Conosco',
  },
};

const availableLanguages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'es' as Language, name: 'Spanish', nativeName: 'Español' },
  { code: 'fr' as Language, name: 'French', nativeName: 'Français' },
  { code: 'pt' as Language, name: 'Portuguese', nativeName: 'Português' },
];

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('nova-language') as Language;
    if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }
    
    // Detect browser language
    const browserLanguage = navigator.language.split('-')[0] as Language;
    if (availableLanguages.some(lang => lang.code === browserLanguage)) {
      return browserLanguage;
    }
    
    return 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('nova-language', newLanguage);
    document.documentElement.lang = newLanguage;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(
          new RegExp(`{{${paramKey}}}`, 'g'),
          String(paramValue)
        );
      });
    }
    
    return translation;
  };

  // Set document language attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
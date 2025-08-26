export type Language = 'en' | 'ar' | 'es' | 'fr';

export interface Translations {
  // Navigation
  home: string;
  dashboard: string;
  loans: string;
  payments: string;
  profile: string;
  logout: string;
  login: string;
  register: string;
  
  // Common
  submit: string;
  cancel: string;
  save: string;
  loading: string;
  error: string;
  success: string;
  back: string;
  next: string;
  finish: string;
  
  // Authentication
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  phoneNumber: string;
  welcomeBack: string;
  createAccount: string;
  forgotPassword: string;
  
  // KYC
  kycVerification: string;
  personalInfo: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  occupation: string;
  annualIncome: string;
  uploadDocuments: string;
  
  // Loans
  applyLoan: string;
  loanAmount: string;
  duration: string;
  monthlyPayment: string;
  totalPayment: string;
  payInstallment: string;
  loanStatus: string;
  
  // Investment
  investByPronova: string;
  capimax: string;
  investmentPortfolio: string;
  
  // Company Info
  aboutUs: string;
  features: string;
  partnerships: string;
  termsConditions: string;
  risks: string;
  faq: string;
  contactUs: string;
}

export type TranslationKey = keyof Translations;

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    home: 'Home',
    dashboard: 'Dashboard',
    loans: 'Loans',
    payments: 'Payments',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    
    // Common
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    
    // Authentication
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    phoneNumber: 'Phone Number',
    welcomeBack: 'Welcome Back',
    createAccount: 'Create Account',
    forgotPassword: 'Forgot Password?',
    
    // KYC
    kycVerification: 'KYC Verification',
    personalInfo: 'Personal Information',
    fullName: 'Full Name',
    dateOfBirth: 'Date of Birth',
    nationality: 'Nationality',
    address: 'Address',
    city: 'City',
    country: 'Country',
    occupation: 'Occupation',
    annualIncome: 'Annual Income',
    uploadDocuments: 'Upload Documents',
    
    // Loans
    applyLoan: 'Apply for Loan',
    loanAmount: 'Loan Amount',
    duration: 'Duration',
    monthlyPayment: 'Monthly Payment',
    totalPayment: 'Total Payment',
    payInstallment: 'Pay Installment',
    loanStatus: 'Loan Status',
    
    // Investment
    investByPronova: 'Invest by Pronova',
    capimax: 'Capimax',
    investmentPortfolio: 'Investment Portfolio',
    
    // Company Info
    aboutUs: 'About Us',
    features: 'Features',
    partnerships: 'Partnerships',
    termsConditions: 'Terms & Conditions',
    risks: 'Risks',
    faq: 'FAQ',
    contactUs: 'Contact Us',
  },
  
  ar: {
    // Navigation
    home: 'الرئيسية',
    dashboard: 'لوحة التحكم',
    loans: 'القروض',
    payments: 'المدفوعات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    
    // Common
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    back: 'العودة',
    next: 'التالي',
    finish: 'انتهاء',
    
    // Authentication
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    username: 'اسم المستخدم',
    phoneNumber: 'رقم الهاتف',
    welcomeBack: 'مرحباً بعودتك',
    createAccount: 'إنشاء حساب',
    forgotPassword: 'نسيت كلمة المرور؟',
    
    // KYC
    kycVerification: 'التحقق من الهوية',
    personalInfo: 'المعلومات الشخصية',
    fullName: 'الاسم الكامل',
    dateOfBirth: 'تاريخ الميلاد',
    nationality: 'الجنسية',
    address: 'العنوان',
    city: 'المدينة',
    country: 'البلد',
    occupation: 'المهنة',
    annualIncome: 'الدخل السنوي',
    uploadDocuments: 'رفع الوثائق',
    
    // Loans
    applyLoan: 'تقدم بطلب قرض',
    loanAmount: 'مبلغ القرض',
    duration: 'المدة',
    monthlyPayment: 'الدفعة الشهرية',
    totalPayment: 'إجمالي المدفوعات',
    payInstallment: 'دفع القسط',
    loanStatus: 'حالة القرض',
    
    // Investment
    investByPronova: 'الاستثمار بـ برونوفا',
    capimax: 'كابيماكس',
    investmentPortfolio: 'محفظة الاستثمار',
    
    // Company Info
    aboutUs: 'من نحن',
    features: 'المميزات',
    partnerships: 'الشراكات',
    termsConditions: 'الشروط والأحكام',
    risks: 'المخاطر',
    faq: 'الأسئلة الشائعة',
    contactUs: 'اتصل بنا',
  },
  
  es: {
    // Navigation
    home: 'Inicio',
    dashboard: 'Panel',
    loans: 'Préstamos',
    payments: 'Pagos',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    
    // Common
    submit: 'Enviar',
    cancel: 'Cancelar',
    save: 'Guardar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Finalizar',
    
    // Authentication
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    username: 'Nombre de Usuario',
    phoneNumber: 'Número de Teléfono',
    welcomeBack: 'Bienvenido de Nuevo',
    createAccount: 'Crear Cuenta',
    forgotPassword: '¿Olvidaste tu Contraseña?',
    
    // KYC
    kycVerification: 'Verificación KYC',
    personalInfo: 'Información Personal',
    fullName: 'Nombre Completo',
    dateOfBirth: 'Fecha de Nacimiento',
    nationality: 'Nacionalidad',
    address: 'Dirección',
    city: 'Ciudad',
    country: 'País',
    occupation: 'Ocupación',
    annualIncome: 'Ingresos Anuales',
    uploadDocuments: 'Subir Documentos',
    
    // Loans
    applyLoan: 'Solicitar Préstamo',
    loanAmount: 'Monto del Préstamo',
    duration: 'Duración',
    monthlyPayment: 'Pago Mensual',
    totalPayment: 'Pago Total',
    payInstallment: 'Pagar Cuota',
    loanStatus: 'Estado del Préstamo',
    
    // Investment
    investByPronova: 'Invertir con Pronova',
    capimax: 'Capimax',
    investmentPortfolio: 'Cartera de Inversión',
    
    // Company Info
    aboutUs: 'Acerca de Nosotros',
    features: 'Características',
    partnerships: 'Asociaciones',
    termsConditions: 'Términos y Condiciones',
    risks: 'Riesgos',
    faq: 'Preguntas Frecuentes',
    contactUs: 'Contáctanos',
  },
  
  fr: {
    // Navigation
    home: 'Accueil',
    dashboard: 'Tableau de Bord',
    loans: 'Prêts',
    payments: 'Paiements',
    profile: 'Profil',
    logout: 'Se Déconnecter',
    login: 'Se Connecter',
    register: 'S\'inscrire',
    
    // Common
    submit: 'Soumettre',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    back: 'Retour',
    next: 'Suivant',
    finish: 'Terminer',
    
    // Authentication
    email: 'E-mail',
    password: 'Mot de Passe',
    confirmPassword: 'Confirmer le Mot de Passe',
    username: 'Nom d\'Utilisateur',
    phoneNumber: 'Numéro de Téléphone',
    welcomeBack: 'Bon Retour',
    createAccount: 'Créer un Compte',
    forgotPassword: 'Mot de Passe Oublié?',
    
    // KYC
    kycVerification: 'Vérification KYC',
    personalInfo: 'Informations Personnelles',
    fullName: 'Nom Complet',
    dateOfBirth: 'Date de Naissance',
    nationality: 'Nationalité',
    address: 'Adresse',
    city: 'Ville',
    country: 'Pays',
    occupation: 'Profession',
    annualIncome: 'Revenu Annuel',
    uploadDocuments: 'Télécharger Documents',
    
    // Loans
    applyLoan: 'Demander un Prêt',
    loanAmount: 'Montant du Prêt',
    duration: 'Durée',
    monthlyPayment: 'Paiement Mensuel',
    totalPayment: 'Paiement Total',
    payInstallment: 'Payer l\'Acompte',
    loanStatus: 'Statut du Prêt',
    
    // Investment
    investByPronova: 'Investir avec Pronova',
    capimax: 'Capimax',
    investmentPortfolio: 'Portefeuille d\'Investissement',
    
    // Company Info
    aboutUs: 'À Propos de Nous',
    features: 'Caractéristiques',
    partnerships: 'Partenariats',
    termsConditions: 'Termes et Conditions',
    risks: 'Risques',
    faq: 'FAQ',
    contactUs: 'Nous Contacter',
  },
};
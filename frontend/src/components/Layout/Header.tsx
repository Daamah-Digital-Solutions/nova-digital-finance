import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../utils/cn';
import { 
  Bars3Icon, 
  XMarkIcon, 
  SunIcon, 
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  HomeIcon,
  InformationCircleIcon,
  PhoneIcon,
  Squares2X2Icon,
  CogIcon
} from '@heroicons/react/24/outline';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, effectiveTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for clean header styling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Simplified navigation structure following Nova Finance UI principles
  const navItems = [
    { path: '/', label: t('home'), icon: HomeIcon },
    { path: '/about', label: t('aboutUs'), icon: InformationCircleIcon },
    { path: '/contact', label: 'Contact', icon: PhoneIcon },
  ];

  // User menu items for authenticated users
  const userMenuItems = isAuthenticated ? [
    { path: '/dashboard', label: t('dashboard'), icon: Squares2X2Icon },
    { path: '/profile', label: t('profile'), icon: UserCircleIcon },
    { path: '/settings', label: 'Settings', icon: CogIcon },
  ] : [];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b",
      effectiveTheme === 'dark' 
        ? scrolled 
          ? "bg-gray-900/95 backdrop-blur-md border-gray-700 shadow-lg" 
          : "bg-gray-900/90 backdrop-blur-sm border-gray-700/50"
        : scrolled
          ? "bg-white/95 backdrop-blur-md border-gray-200 shadow-lg"
          : "bg-white/90 backdrop-blur-sm border-gray-200/50"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Clean Nova Finance Branding */}
          <Link to="/" className="flex items-center group">
            <div className={cn(
              "h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-200 shadow-sm",
              "bg-gradient-to-br from-indigo-500 to-indigo-600",
              "group-hover:shadow-md group-hover:scale-105 group-hover:from-indigo-600 group-hover:to-indigo-700"
            )}>
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            
            <div className="ml-3">
              <div className={cn(
                "text-lg font-semibold transition-colors duration-200",
                effectiveTheme === 'dark' ? "text-white" : "text-gray-900"
              )}>
                Nova Finance
              </div>
              <div className={cn(
                "text-xs font-medium uppercase tracking-wider",
                effectiveTheme === 'dark' ? "text-indigo-400" : "text-indigo-600"
              )}>
                Islamic Banking
              </div>
            </div>
          </Link>

          {/* Clean Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium",
                    isActive
                      ? effectiveTheme === 'dark'
                        ? "text-indigo-400 bg-gray-800" 
                        : "text-indigo-600 bg-indigo-50"
                      : effectiveTheme === 'dark'
                        ? "text-gray-300 hover:text-indigo-400 hover:bg-gray-800/50"
                        : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Clean Right Side Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                effectiveTheme === 'dark'
                  ? "text-gray-300 hover:text-indigo-400 hover:bg-gray-800"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100"
              )}
              aria-label="Toggle theme"
            >
              {effectiveTheme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>

            {/* Authentication */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md border transition-all duration-200 text-sm",
                    effectiveTheme === 'dark'
                      ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">{user?.firstName}</span>
                  <ChevronDownIcon className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    profileMenuOpen && "rotate-180"
                  )} />
                </button>
                
                {/* Profile Dropdown */}
                {profileMenuOpen && (
                  <div className={cn(
                    "absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50",
                    effectiveTheme === 'dark'
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  )}>
                    <div className="p-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActivePath(item.path);
                        
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setProfileMenuOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200",
                              isActive
                                ? effectiveTheme === 'dark'
                                  ? "bg-gray-700 text-indigo-400"
                                  : "bg-indigo-50 text-indigo-600"
                                : effectiveTheme === 'dark'
                                  ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                      
                      <div className={cn(
                        "border-t mt-2 pt-2",
                        effectiveTheme === 'dark' ? "border-gray-700" : "border-gray-200"
                      )}>
                        <button
                          onClick={handleLogout}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200",
                            effectiveTheme === 'dark'
                              ? "text-red-400 hover:bg-red-900/20"
                              : "text-red-600 hover:bg-red-50"
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                          <span className="font-medium">{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    effectiveTheme === 'dark'
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-700 hover:text-gray-900"
                  )}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "md:hidden p-2 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                effectiveTheme === 'dark'
                  ? "text-gray-300 hover:text-white hover:bg-gray-800"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={cn(
            "md:hidden border-t mt-2 pt-4 pb-4",
            effectiveTheme === 'dark' ? "border-gray-700" : "border-gray-200"
          )}>
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                
                return (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                      isActive
                        ? effectiveTheme === 'dark'
                          ? "text-indigo-400 bg-gray-800"
                          : "text-indigo-600 bg-indigo-50"
                        : effectiveTheme === 'dark'
                          ? "text-gray-300 hover:text-indigo-400 hover:bg-gray-800/50"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            
            {!isAuthenticated && (
              <div className={cn(
                "border-t mt-4 pt-4 space-y-3",
                effectiveTheme === 'dark' ? "border-gray-700" : "border-gray-200"
              )}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    effectiveTheme === 'dark'
                      ? "text-gray-300 hover:text-white hover:bg-gray-800"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
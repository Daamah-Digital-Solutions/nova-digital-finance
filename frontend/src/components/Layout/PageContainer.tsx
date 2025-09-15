import React from 'react';
import { cn } from '../../utils/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'wide' | 'full';
  noPadding?: boolean;
}

/**
 * PageContainer Component - Nova Finance UI System
 * 
 * Provides consistent page layout with proper Header spacing using Nova Finance design tokens.
 * Handles the fixed Header overlap issue by applying appropriate top padding.
 * 
 * Features:
 * - Automatic Header spacing (pt-16 = 64px to match Header height)
 * - Responsive container variants
 * - Design token-based spacing
 * - Theme-aware styling
 * - Accessibility-friendly structure
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  variant = 'default',
  noPadding = false,
}) => {
  const containerClasses = cn(
    // Base layout - compensate for fixed Header
    'min-h-screen',
    'pt-16', // 64px top padding to match Header height (h-16)
    
    // Container variants using Nova Finance design tokens
    variant === 'default' && [
      'max-w-7xl', // 1280px max width
      'mx-auto', // Center horizontally
      'px-4 sm:px-6 lg:px-8', // Responsive horizontal padding
    ],
    variant === 'wide' && [
      'max-w-none', // Full width
      'mx-auto',
      'px-4 sm:px-6 lg:px-8',
    ],
    variant === 'full' && [
      'w-full', // Full width, no container
      noPadding ? '' : 'px-4 sm:px-6 lg:px-8',
    ],
    
    // Additional top padding for content breathing room
    !noPadding && 'py-6 sm:py-8 lg:py-12',
    
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

export default PageContainer;
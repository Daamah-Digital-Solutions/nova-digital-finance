/**
 * Utility function to merge class names with conditional logic
 * Similar to clsx/classnames libraries
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

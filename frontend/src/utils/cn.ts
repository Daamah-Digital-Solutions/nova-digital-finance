/**
 * Utility function to merge class names with conditional logic
 * Similar to clsx/classnames libraries
 */
type ClassValue = string | undefined | null | false | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(Infinity)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}

/**
 * Utility function to merge class names with conditional logic
 * Similar to clsx/classnames libraries
 */
type ClassInput = string | undefined | null | false | string[];

export function cn(...classes: ClassInput[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;
    if (typeof cls === 'string') {
      result.push(cls);
    } else if (Array.isArray(cls)) {
      result.push(...cls.filter(Boolean) as string[]);
    }
  }

  return result.join(' ');
}

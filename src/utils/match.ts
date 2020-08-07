import { isMatch } from 'micromatch';

export default function match(str: string, include: string[] = [], exclude: string[] = []): boolean {
  const isIncluded = include.length === 0 || isMatch(str, include);
  const isNotExcluded = exclude.length === 0 || !isMatch(str, exclude);
  return isIncluded && isNotExcluded;
}

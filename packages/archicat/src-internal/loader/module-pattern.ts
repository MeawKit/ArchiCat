import fs from 'node:fs';
import path from 'node:path';

// MARK: - Public

export function resolveModuleContractPatterns(rootDir: string, patterns: readonly string[]): string[] {
  const files = patterns.flatMap((pattern) => expandSingleStarPattern(rootDir, pattern));
  return Array.from(new Set(files)).sort((a, b) => a.localeCompare(b));
}

// MARK: - Private

function expandSingleStarPattern(rootDir: string, pattern: string): string[] {
  const absolutePattern = path.resolve(rootDir, pattern);

  if (!absolutePattern.includes('*')) {
    return fs.existsSync(absolutePattern) ? [absolutePattern] : [];
  }

  const parts = absolutePattern.split(path.sep);
  const starSegments = parts.filter((part) => part.includes('*'));

  if (starSegments.length !== 1) {
    throw new Error(`ArchiCat V1 supports exactly one wildcard segment per include pattern: ${pattern}`);
  }

  const starIndex = parts.findIndex((part) => part.includes('*'));
  const beforeStar = parts.slice(0, starIndex).join(path.sep) || path.sep;
  const wildcard = parts[starIndex] ?? '*';
  const afterStar = parts.slice(starIndex + 1);
  const regexp = makeWildcardRegExp(wildcard);

  if (!fs.existsSync(beforeStar)) {
    return [];
  }

  return fs
    .readdirSync(beforeStar, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => regexp.test(entry.name))
    .map((entry) => path.join(beforeStar, entry.name, ...afterStar))
    .filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function makeWildcardRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replace(/\*/gu, '.*');
  return new RegExp(`^${escaped}$`, 'u');
}

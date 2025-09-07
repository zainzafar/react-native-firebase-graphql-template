/**
 * Semantic version comparison utilities
 * Handles version strings in format: major.minor.patch (e.g., "1.2.3")
 */

/**
 * Compares two semantic version strings
 * @param a First version string
 * @param b Second version string
 * @returns Negative if a < b, 0 if equal, positive if a > b
 */
export function compareSemver(a: string, b: string): number {
  const parseVersion = (version: string): number[] => {
    return version
      .split('.')
      .map(part => {
        // Extract numeric part, treat non-numeric as 0
        const match = part.match(/^\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .slice(0, 3) // Only take first 3 parts (major.minor.patch)
      .concat([0, 0, 0]) // Pad with zeros
      .slice(0, 3); // Ensure exactly 3 parts
  };

  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  // Compare each part
  for (let i = 0; i < 3; i++) {
    if (versionA[i] !== versionB[i]) {
      return versionA[i] - versionB[i];
    }
  }

  return 0; // Versions are equal
}

/**
 * Checks if the current version is below the minimum required version
 * @param current Current app version
 * @param minVersion Minimum required version
 * @returns True if current version is below minimum
 */
export function isBelowMinVersion(current: string, minVersion: string): boolean {
  return compareSemver(current, minVersion) < 0;
}

/**
 * Checks if the current version is behind the latest available version
 * @param current Current app version
 * @param latestVersion Latest available version
 * @returns True if current version is behind latest
 */
export function isBehindLatestVersion(current: string, latestVersion: string): boolean {
  return compareSemver(current, latestVersion) < 0;
}

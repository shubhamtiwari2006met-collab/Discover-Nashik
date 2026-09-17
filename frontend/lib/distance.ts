/**
 * Formats a distance in kilometers into a human-readable string.
 * @param km Distance in kilometers
 * @returns Formatted string e.g. "350 m", "1.2 km"
 */
export function formatDistance(km: number | undefined | null): string {
  if (km === undefined || km === null || isNaN(km)) {
    return '';
  }

  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }

  return `${km.toFixed(1)} km`;
}

/**
 * Calculates Haversine distance in km between two lat/lng pairs on the client-side.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

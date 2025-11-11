export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function haversineDistance(
  coords1: Coordinates,
  coords2: Coordinates
): number {
  const R = 3959;
  const dLat = toRadians(coords2.latitude - coords1.latitude);
  const dLon = toRadians(coords2.longitude - coords1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.latitude)) *
      Math.cos(toRadians(coords2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

const ZIP_TO_COORDS: Record<string, Coordinates> = {
  '97209': { latitude: 45.5152, longitude: -122.6784 },
  '28801': { latitude: 35.5951, longitude: -82.5515 },
  '78701': { latitude: 30.2672, longitude: -97.7431 },
  '80202': { latitude: 39.7392, longitude: -104.9903 },
  '98101': { latitude: 47.6062, longitude: -122.3321 },
  '37203': { latitude: 36.1627, longitude: -86.7816 },
  '10001': { latitude: 40.7506, longitude: -73.9971 },
  '90001': { latitude: 33.9731, longitude: -118.2479 },
  '60601': { latitude: 41.8858, longitude: -87.6229 },
  '33101': { latitude: 25.7751, longitude: -80.1947 },
};

export async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  if (ZIP_TO_COORDS[zipCode]) {
    return ZIP_TO_COORDS[zipCode];
  }

  return null;
}

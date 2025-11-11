/**
 * ZIP Code Distance Calculation Utility
 * 
 * Calculates distance between two ZIP codes using Haversine formula.
 * Uses approximate ZIP to lat/lon mapping for U.S. ZIP codes.
 */

interface ZipCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Basic ZIP code to coordinate mapping
 * In production, this should use a complete ZIP database or API
 * For now, we use the first 3 digits to approximate location
 */
const ZIP_PREFIX_COORDINATES: Record<string, ZipCoordinate> = {
  '010': { latitude: 42.3601, longitude: -71.0589 },
  '011': { latitude: 42.3601, longitude: -71.0589 },
  '012': { latitude: 42.3601, longitude: -71.0589 },
  '013': { latitude: 42.3601, longitude: -71.0589 },
  '014': { latitude: 42.3601, longitude: -71.0589 },
  '015': { latitude: 42.3601, longitude: -71.0589 },
  '016': { latitude: 42.3601, longitude: -71.0589 },
  '017': { latitude: 42.3601, longitude: -71.0589 },
  '018': { latitude: 42.3601, longitude: -71.0589 },
  '019': { latitude: 42.3601, longitude: -71.0589 },
  '020': { latitude: 38.9072, longitude: -77.0369 },
  '021': { latitude: 38.9072, longitude: -77.0369 },
  '022': { latitude: 38.9072, longitude: -77.0369 },
  '023': { latitude: 38.9072, longitude: -77.0369 },
  '024': { latitude: 38.9072, longitude: -77.0369 },
  '025': { latitude: 38.9072, longitude: -77.0369 },
  '026': { latitude: 38.9072, longitude: -77.0369 },
  '027': { latitude: 38.9072, longitude: -77.0369 },
  '100': { latitude: 40.7128, longitude: -74.0060 },
  '101': { latitude: 40.7128, longitude: -74.0060 },
  '102': { latitude: 40.7128, longitude: -74.0060 },
  '103': { latitude: 40.7128, longitude: -74.0060 },
  '104': { latitude: 40.7128, longitude: -74.0060 },
  '105': { latitude: 40.7128, longitude: -74.0060 },
  '106': { latitude: 40.7128, longitude: -74.0060 },
  '107': { latitude: 40.7128, longitude: -74.0060 },
  '108': { latitude: 40.7128, longitude: -74.0060 },
  '109': { latitude: 40.7128, longitude: -74.0060 },
  '110': { latitude: 40.7128, longitude: -74.0060 },
  '111': { latitude: 40.7128, longitude: -74.0060 },
  '112': { latitude: 40.7128, longitude: -74.0060 },
  '113': { latitude: 40.7128, longitude: -74.0060 },
  '114': { latitude: 40.7128, longitude: -74.0060 },
  '115': { latitude: 40.7128, longitude: -74.0060 },
  '116': { latitude: 40.7128, longitude: -74.0060 },
  '117': { latitude: 40.7128, longitude: -74.0060 },
  '118': { latitude: 40.7128, longitude: -74.0060 },
  '119': { latitude: 40.7128, longitude: -74.0060 },
  '300': { latitude: 33.7490, longitude: -84.3880 },
  '301': { latitude: 33.7490, longitude: -84.3880 },
  '302': { latitude: 33.7490, longitude: -84.3880 },
  '303': { latitude: 33.7490, longitude: -84.3880 },
  '304': { latitude: 33.7490, longitude: -84.3880 },
  '305': { latitude: 33.7490, longitude: -84.3880 },
  '306': { latitude: 33.7490, longitude: -84.3880 },
  '307': { latitude: 33.7490, longitude: -84.3880 },
  '308': { latitude: 33.7490, longitude: -84.3880 },
  '309': { latitude: 33.7490, longitude: -84.3880 },
  '310': { latitude: 33.7490, longitude: -84.3880 },
  '311': { latitude: 33.7490, longitude: -84.3880 },
  '312': { latitude: 33.7490, longitude: -84.3880 },
  '400': { latitude: 38.2527, longitude: -85.7585 },
  '401': { latitude: 38.2527, longitude: -85.7585 },
  '402': { latitude: 38.2527, longitude: -85.7585 },
  '403': { latitude: 38.2527, longitude: -85.7585 },
  '404': { latitude: 38.2527, longitude: -85.7585 },
  '405': { latitude: 38.2527, longitude: -85.7585 },
  '406': { latitude: 38.2527, longitude: -85.7585 },
  '407': { latitude: 38.2527, longitude: -85.7585 },
  '408': { latitude: 38.2527, longitude: -85.7585 },
  '409': { latitude: 38.2527, longitude: -85.7585 },
  '410': { latitude: 38.2527, longitude: -85.7585 },
  '411': { latitude: 38.2527, longitude: -85.7585 },
  '412': { latitude: 38.2527, longitude: -85.7585 },
  '413': { latitude: 38.2527, longitude: -85.7585 },
  '414': { latitude: 38.2527, longitude: -85.7585 },
  '415': { latitude: 38.2527, longitude: -85.7585 },
  '416': { latitude: 38.2527, longitude: -85.7585 },
  '500': { latitude: 41.8781, longitude: -87.6298 },
  '501': { latitude: 41.8781, longitude: -87.6298 },
  '502': { latitude: 41.8781, longitude: -87.6298 },
  '503': { latitude: 41.8781, longitude: -87.6298 },
  '504': { latitude: 41.8781, longitude: -87.6298 },
  '505': { latitude: 41.8781, longitude: -87.6298 },
  '506': { latitude: 41.8781, longitude: -87.6298 },
  '507': { latitude: 41.8781, longitude: -87.6298 },
  '508': { latitude: 41.8781, longitude: -87.6298 },
  '509': { latitude: 41.8781, longitude: -87.6298 },
  '510': { latitude: 41.8781, longitude: -87.6298 },
  '511': { latitude: 41.8781, longitude: -87.6298 },
  '512': { latitude: 41.8781, longitude: -87.6298 },
  '513': { latitude: 41.8781, longitude: -87.6298 },
  '514': { latitude: 41.8781, longitude: -87.6298 },
  '515': { latitude: 41.8781, longitude: -87.6298 },
  '516': { latitude: 41.8781, longitude: -87.6298 },
  '517': { latitude: 41.8781, longitude: -87.6298 },
  '518': { latitude: 41.8781, longitude: -87.6298 },
  '519': { latitude: 41.8781, longitude: -87.6298 },
  '520': { latitude: 41.8781, longitude: -87.6298 },
  '521': { latitude: 41.8781, longitude: -87.6298 },
  '522': { latitude: 41.8781, longitude: -87.6298 },
  '523': { latitude: 41.8781, longitude: -87.6298 },
  '524': { latitude: 41.8781, longitude: -87.6298 },
  '525': { latitude: 41.8781, longitude: -87.6298 },
  '526': { latitude: 41.8781, longitude: -87.6298 },
  '527': { latitude: 41.8781, longitude: -87.6298 },
  '530': { latitude: 44.9778, longitude: -93.2650 },
  '531': { latitude: 44.9778, longitude: -93.2650 },
  '532': { latitude: 44.9778, longitude: -93.2650 },
  '533': { latitude: 44.9778, longitude: -93.2650 },
  '534': { latitude: 44.9778, longitude: -93.2650 },
  '535': { latitude: 44.9778, longitude: -93.2650 },
  '536': { latitude: 44.9778, longitude: -93.2650 },
  '537': { latitude: 44.9778, longitude: -93.2650 },
  '538': { latitude: 44.9778, longitude: -93.2650 },
  '539': { latitude: 44.9778, longitude: -93.2650 },
  '540': { latitude: 44.9778, longitude: -93.2650 },
  '541': { latitude: 44.9778, longitude: -93.2650 },
  '542': { latitude: 44.9778, longitude: -93.2650 },
  '543': { latitude: 44.9778, longitude: -93.2650 },
  '544': { latitude: 44.9778, longitude: -93.2650 },
  '545': { latitude: 44.9778, longitude: -93.2650 },
  '546': { latitude: 44.9778, longitude: -93.2650 },
  '547': { latitude: 44.9778, longitude: -93.2650 },
  '548': { latitude: 44.9778, longitude: -93.2650 },
  '549': { latitude: 44.9778, longitude: -93.2650 },
  '550': { latitude: 44.9778, longitude: -93.2650 },
  '600': { latitude: 39.7392, longitude: -104.9903 },
  '601': { latitude: 39.7392, longitude: -104.9903 },
  '602': { latitude: 39.7392, longitude: -104.9903 },
  '603': { latitude: 39.7392, longitude: -104.9903 },
  '604': { latitude: 39.7392, longitude: -104.9903 },
  '605': { latitude: 39.7392, longitude: -104.9903 },
  '606': { latitude: 39.7392, longitude: -104.9903 },
  '700': { latitude: 29.7604, longitude: -95.3698 },
  '701': { latitude: 29.7604, longitude: -95.3698 },
  '702': { latitude: 29.7604, longitude: -95.3698 },
  '703': { latitude: 29.7604, longitude: -95.3698 },
  '704': { latitude: 29.7604, longitude: -95.3698 },
  '705': { latitude: 29.7604, longitude: -95.3698 },
  '706': { latitude: 29.7604, longitude: -95.3698 },
  '707': { latitude: 29.7604, longitude: -95.3698 },
  '708': { latitude: 29.7604, longitude: -95.3698 },
  '709': { latitude: 29.7604, longitude: -95.3698 },
  '710': { latitude: 29.7604, longitude: -95.3698 },
  '711': { latitude: 29.7604, longitude: -95.3698 },
  '712': { latitude: 29.7604, longitude: -95.3698 },
  '713': { latitude: 29.7604, longitude: -95.3698 },
  '714': { latitude: 29.7604, longitude: -95.3698 },
  '715': { latitude: 29.7604, longitude: -95.3698 },
  '716': { latitude: 29.7604, longitude: -95.3698 },
  '717': { latitude: 29.7604, longitude: -95.3698 },
  '718': { latitude: 29.7604, longitude: -95.3698 },
  '719': { latitude: 29.7604, longitude: -95.3698 },
  '720': { latitude: 29.7604, longitude: -95.3698 },
  '800': { latitude: 37.7749, longitude: -122.4194 },
  '801': { latitude: 37.7749, longitude: -122.4194 },
  '802': { latitude: 37.7749, longitude: -122.4194 },
  '803': { latitude: 37.7749, longitude: -122.4194 },
  '804': { latitude: 37.7749, longitude: -122.4194 },
  '805': { latitude: 37.7749, longitude: -122.4194 },
  '806': { latitude: 37.7749, longitude: -122.4194 },
  '807': { latitude: 37.7749, longitude: -122.4194 },
  '808': { latitude: 37.7749, longitude: -122.4194 },
  '900': { latitude: 34.0522, longitude: -118.2437 },
  '901': { latitude: 34.0522, longitude: -118.2437 },
  '902': { latitude: 34.0522, longitude: -118.2437 },
  '903': { latitude: 34.0522, longitude: -118.2437 },
  '904': { latitude: 34.0522, longitude: -118.2437 },
  '905': { latitude: 34.0522, longitude: -118.2437 },
  '906': { latitude: 34.0522, longitude: -118.2437 },
  '907': { latitude: 34.0522, longitude: -118.2437 },
  '908': { latitude: 34.0522, longitude: -118.2437 },
  '909': { latitude: 34.0522, longitude: -118.2437 },
  '910': { latitude: 34.0522, longitude: -118.2437 },
  '911': { latitude: 34.0522, longitude: -118.2437 },
  '912': { latitude: 34.0522, longitude: -118.2437 },
  '913': { latitude: 34.0522, longitude: -118.2437 },
  '914': { latitude: 34.0522, longitude: -118.2437 },
  '915': { latitude: 34.0522, longitude: -118.2437 },
  '916': { latitude: 34.0522, longitude: -118.2437 },
  '917': { latitude: 34.0522, longitude: -118.2437 },
  '918': { latitude: 34.0522, longitude: -118.2437 },
  '919': { latitude: 34.0522, longitude: -118.2437 },
  '920': { latitude: 34.0522, longitude: -118.2437 },
  '921': { latitude: 34.0522, longitude: -118.2437 },
  '922': { latitude: 34.0522, longitude: -118.2437 },
  '923': { latitude: 34.0522, longitude: -118.2437 },
  '924': { latitude: 34.0522, longitude: -118.2437 },
  '925': { latitude: 34.0522, longitude: -118.2437 },
  '926': { latitude: 34.0522, longitude: -118.2437 },
  '927': { latitude: 34.0522, longitude: -118.2437 },
  '928': { latitude: 34.0522, longitude: -118.2437 },
  '930': { latitude: 34.0522, longitude: -118.2437 },
  '931': { latitude: 34.0522, longitude: -118.2437 },
  '932': { latitude: 34.0522, longitude: -118.2437 },
  '933': { latitude: 34.0522, longitude: -118.2437 },
  '934': { latitude: 34.0522, longitude: -118.2437 },
  '935': { latitude: 34.0522, longitude: -118.2437 },
};

/**
 * Haversine formula to calculate distance between two coordinates
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get approximate coordinates for a ZIP code
 * @param zip ZIP code (5 digits)
 * @returns Coordinates or null if not found
 */
function getZipCoordinates(zip: string): ZipCoordinate | null {
  if (!zip || zip.length < 3) {
    return null;
  }
  
  const prefix = zip.substring(0, 3);
  return ZIP_PREFIX_COORDINATES[prefix] || null;
}

/**
 * Calculate distance between two ZIP codes
 * @param zipA First ZIP code
 * @param zipB Second ZIP code
 * @returns Distance in miles, or null if calculation fails
 */
export function getDistanceMiles(zipA: string, zipB: string): number | null {
  const coordsA = getZipCoordinates(zipA);
  const coordsB = getZipCoordinates(zipB);
  
  if (!coordsA || !coordsB) {
    console.log('[ZipDistance] Could not find coordinates for ZIPs:', zipA, zipB);
    return null;
  }
  
  const distance = haversineDistance(
    coordsA.latitude,
    coordsA.longitude,
    coordsB.latitude,
    coordsB.longitude
  );
  
  console.log(`[ZipDistance] Distance between ${zipA} and ${zipB}: ${distance.toFixed(1)} miles`);
  return distance;
}

/**
 * Check if local pickup is available based on distance
 * @param vendorZip Vendor's origin ZIP code
 * @param customerZip Customer's ZIP code
 * @param maxDistanceMiles Maximum distance for pickup (default 75)
 * @returns True if pickup is available, false otherwise
 */
export function isPickupAvailable(
  vendorZip: string | undefined,
  customerZip: string | undefined,
  maxDistanceMiles: number = 75
): boolean {
  if (!vendorZip || !customerZip) {
    console.log('[ZipDistance] Missing ZIP codes, allowing pickup by default');
    return true;
  }
  
  const distance = getDistanceMiles(vendorZip, customerZip);
  
  if (distance === null) {
    console.log('[ZipDistance] Could not calculate distance, allowing pickup by default');
    return true;
  }
  
  const available = distance <= maxDistanceMiles;
  console.log(`[ZipDistance] Pickup ${available ? 'available' : 'not available'} (${distance.toFixed(1)} miles, max ${maxDistanceMiles})`);
  
  return available;
}

/**
 * Format distance for display
 * @param miles Distance in miles
 * @returns Formatted string
 */
export function formatDistance(miles: number): string {
  if (miles < 1) {
    return 'Less than 1 mile away';
  } else if (miles < 10) {
    return `${miles.toFixed(1)} miles away`;
  } else {
    return `${Math.round(miles)} miles away`;
}
}

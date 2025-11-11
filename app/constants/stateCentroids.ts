export interface StateCoordinate {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const STATE_CENTROIDS: Record<string, StateCoordinate> = {
  AL: { code: 'AL', name: 'Alabama', latitude: 32.806671, longitude: -86.791130 },
  AK: { code: 'AK', name: 'Alaska', latitude: 61.370716, longitude: -152.404419 },
  AZ: { code: 'AZ', name: 'Arizona', latitude: 33.729759, longitude: -111.431221 },
  AR: { code: 'AR', name: 'Arkansas', latitude: 34.969704, longitude: -92.373123 },
  CA: { code: 'CA', name: 'California', latitude: 36.116203, longitude: -119.681564 },
  CO: { code: 'CO', name: 'Colorado', latitude: 39.059811, longitude: -105.311104 },
  CT: { code: 'CT', name: 'Connecticut', latitude: 41.597782, longitude: -72.755371 },
  DE: { code: 'DE', name: 'Delaware', latitude: 39.318523, longitude: -75.507141 },
  FL: { code: 'FL', name: 'Florida', latitude: 27.766279, longitude: -81.686783 },
  GA: { code: 'GA', name: 'Georgia', latitude: 33.040619, longitude: -83.643074 },
  HI: { code: 'HI', name: 'Hawaii', latitude: 21.094318, longitude: -157.498337 },
  ID: { code: 'ID', name: 'Idaho', latitude: 44.240459, longitude: -114.478828 },
  IL: { code: 'IL', name: 'Illinois', latitude: 40.349457, longitude: -88.986137 },
  IN: { code: 'IN', name: 'Indiana', latitude: 39.849426, longitude: -86.258278 },
  IA: { code: 'IA', name: 'Iowa', latitude: 42.011539, longitude: -93.210526 },
  KS: { code: 'KS', name: 'Kansas', latitude: 38.526600, longitude: -96.726486 },
  KY: { code: 'KY', name: 'Kentucky', latitude: 37.668140, longitude: -84.670067 },
  LA: { code: 'LA', name: 'Louisiana', latitude: 31.169546, longitude: -91.867805 },
  ME: { code: 'ME', name: 'Maine', latitude: 44.693947, longitude: -69.381927 },
  MD: { code: 'MD', name: 'Maryland', latitude: 39.063946, longitude: -76.802101 },
  MA: { code: 'MA', name: 'Massachusetts', latitude: 42.230171, longitude: -71.530106 },
  MI: { code: 'MI', name: 'Michigan', latitude: 43.326618, longitude: -84.536095 },
  MN: { code: 'MN', name: 'Minnesota', latitude: 45.694454, longitude: -93.900192 },
  MS: { code: 'MS', name: 'Mississippi', latitude: 32.741646, longitude: -89.678696 },
  MO: { code: 'MO', name: 'Missouri', latitude: 38.456085, longitude: -92.288368 },
  MT: { code: 'MT', name: 'Montana', latitude: 46.921925, longitude: -110.454353 },
  NE: { code: 'NE', name: 'Nebraska', latitude: 41.125370, longitude: -98.268082 },
  NV: { code: 'NV', name: 'Nevada', latitude: 38.313515, longitude: -117.055374 },
  NH: { code: 'NH', name: 'New Hampshire', latitude: 43.452492, longitude: -71.563896 },
  NJ: { code: 'NJ', name: 'New Jersey', latitude: 40.298904, longitude: -74.521011 },
  NM: { code: 'NM', name: 'New Mexico', latitude: 34.840515, longitude: -106.248482 },
  NY: { code: 'NY', name: 'New York', latitude: 42.165726, longitude: -74.948051 },
  NC: { code: 'NC', name: 'North Carolina', latitude: 35.630066, longitude: -79.806419 },
  ND: { code: 'ND', name: 'North Dakota', latitude: 47.528912, longitude: -99.784012 },
  OH: { code: 'OH', name: 'Ohio', latitude: 40.388783, longitude: -82.764915 },
  OK: { code: 'OK', name: 'Oklahoma', latitude: 35.565342, longitude: -96.928917 },
  OR: { code: 'OR', name: 'Oregon', latitude: 44.572021, longitude: -122.070938 },
  PA: { code: 'PA', name: 'Pennsylvania', latitude: 40.590752, longitude: -77.209755 },
  RI: { code: 'RI', name: 'Rhode Island', latitude: 41.680893, longitude: -71.511780 },
  SC: { code: 'SC', name: 'South Carolina', latitude: 33.856892, longitude: -80.945007 },
  SD: { code: 'SD', name: 'South Dakota', latitude: 44.299782, longitude: -99.438828 },
  TN: { code: 'TN', name: 'Tennessee', latitude: 35.747845, longitude: -86.692345 },
  TX: { code: 'TX', name: 'Texas', latitude: 31.054487, longitude: -97.563461 },
  UT: { code: 'UT', name: 'Utah', latitude: 40.150032, longitude: -111.862434 },
  VT: { code: 'VT', name: 'Vermont', latitude: 44.045876, longitude: -72.710686 },
  VA: { code: 'VA', name: 'Virginia', latitude: 37.769337, longitude: -78.169968 },
  WA: { code: 'WA', name: 'Washington', latitude: 47.400902, longitude: -121.490494 },
  WV: { code: 'WV', name: 'West Virginia', latitude: 38.491226, longitude: -80.954456 },
  WI: { code: 'WI', name: 'Wisconsin', latitude: 44.268543, longitude: -89.616508 },
  WY: { code: 'WY', name: 'Wyoming', latitude: 42.755966, longitude: -107.302490 },
};

export const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'Portland, OR': { latitude: 45.5152, longitude: -122.6784 },
  'Asheville, NC': { latitude: 35.5951, longitude: -82.5515 },
  'Austin, TX': { latitude: 30.2672, longitude: -97.7431 },
  'Denver, CO': { latitude: 39.7392, longitude: -104.9903 },
  'Seattle, WA': { latitude: 47.6062, longitude: -122.3321 },
  'Nashville, TN': { latitude: 36.1627, longitude: -86.7816 },
};

export function getVendorMapCoordinate(vendor: {
  latitude?: number;
  longitude?: number;
  location: string;
  state?: string;
}): { latitude: number; longitude: number; isExact: boolean } | null {
  if (vendor.latitude && vendor.longitude) {
    return {
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      isExact: true,
    };
  }

  const cityCoords = CITY_COORDINATES[vendor.location];
  if (cityCoords) {
    return {
      ...cityCoords,
      isExact: false,
    };
  }

  if (vendor.state) {
    const stateCoords = STATE_CENTROIDS[vendor.state];
    if (stateCoords) {
      return {
        latitude: stateCoords.latitude,
        longitude: stateCoords.longitude,
        isExact: false,
      };
    }
  }

  return null;
}

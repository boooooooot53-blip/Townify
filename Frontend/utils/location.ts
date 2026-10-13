import * as Location from "expo-location";

export interface PickedLocation {
  address: string;
  coordinates: [number, number];
  city?: string;
  area?: string;
  street?: string;
}

const DEFAULT_REGION = {
  latitude: 31.5204,
  longitude: 74.3587,
};

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<Omit<PickedLocation, "coordinates">> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];

    if (!place) {
      return {
        address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      };
    }

    const street = [place.streetNumber, place.street].filter(Boolean).join(" ").trim();
    const area = place.district || place.subregion || place.name || undefined;
    const city = place.city || place.region || undefined;
    const parts = [street, area, city, place.country].filter(Boolean);

    return {
      address: parts.join(", ") || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      street: street || undefined,
      area,
      city,
    };
  } catch {
    return {
      address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
}

export async function getCurrentPickedLocation(): Promise<PickedLocation> {
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new Error("Location permission is required");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = position.coords;
  const details = await reverseGeocode(latitude, longitude);

  return {
    ...details,
    coordinates: [longitude, latitude],
  };
}

export async function pickedLocationFromCoordinates(
  latitude: number,
  longitude: number
): Promise<PickedLocation> {
  const details = await reverseGeocode(latitude, longitude);
  return {
    ...details,
    coordinates: [longitude, latitude],
  };
}

export function formatLocationLabel(location?: PickedLocation | null): string {
  if (!location?.address) return "";
  return location.address;
}

export function toApiLocation(location: PickedLocation) {
  return {
    address: location.address,
    coordinates: location.coordinates,
  };
}

export function pickedLocationFromUserAddress(
  address?: {
    street?: string;
    city?: string;
    area?: string;
    coordinates?: number[];
  } | null
): PickedLocation | null {
  if (!address) return null;

  const parts = [address.street, address.area, address.city].filter(Boolean);
  if (!parts.length && !address.coordinates?.length) return null;

  const coords = address.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length === 2;

  return {
    address: parts.join(", ") || "Saved location",
    street: address.street,
    area: address.area,
    city: address.city,
    coordinates: hasCoords ? [coords[0], coords[1]] : [DEFAULT_REGION.longitude, DEFAULT_REGION.latitude],
  };
}

export function toUserAddress(location: PickedLocation) {
  return {
    street: location.street,
    area: location.area,
    city: location.city,
    coordinates: location.coordinates,
  };
}

export { DEFAULT_REGION };
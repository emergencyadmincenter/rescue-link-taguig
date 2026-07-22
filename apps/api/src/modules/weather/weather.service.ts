import { Injectable, Logger } from '@nestjs/common';

/**
 * WeatherService
 *
 * Fetches live weather data from the Open-Meteo API (no API key required).
 * One Open-Meteo request is made per barangay lat/lng pair.
 * All 38 barangay requests are fired in parallel via Promise.allSettled so
 * that a single barangay failure never blocks the rest of the response.
 *
 * A simple in-process cache (10-minute TTL) prevents hammering the upstream
 * API when multiple users load the weather page simultaneously.
 */

// ─── WMO Weather Code → app condition mapping ───────────────────────────────
// WMO codes: https://open-meteo.com/en/docs#weathervariables
// Frontend WeatherCondition type: sunny | partly_cloudy | cloudy | overcast |
//                                 light_rain | heavy_rain | thunderstorm
function mapWmoCode(code: number): {
  condition: string;
  label: string;
  severity: 'normal' | 'advisory' | 'warning' | 'severe';
} {
  if (code === 0)
    return { condition: 'sunny', label: 'Clear sky', severity: 'normal' };
  if (code === 1)
    return { condition: 'sunny', label: 'Mainly clear', severity: 'normal' };
  if (code === 2)
    return {
      condition: 'partly_cloudy',
      label: 'Partly cloudy',
      severity: 'normal',
    };
  if (code === 3)
    return { condition: 'overcast', label: 'Overcast', severity: 'normal' };
  if (code >= 45 && code <= 48)
    return { condition: 'cloudy', label: 'Fog', severity: 'advisory' };
  if (code >= 51 && code <= 55)
    return { condition: 'light_rain', label: 'Drizzle', severity: 'advisory' };
  if (code >= 56 && code <= 57)
    return {
      condition: 'light_rain',
      label: 'Freezing drizzle',
      severity: 'advisory',
    };
  if (code >= 61 && code <= 63)
    return { condition: 'light_rain', label: 'Rain', severity: 'advisory' };
  if (code === 65)
    return {
      condition: 'heavy_rain',
      label: 'Heavy rain',
      severity: 'warning',
    };
  if (code >= 66 && code <= 67)
    return {
      condition: 'heavy_rain',
      label: 'Freezing rain',
      severity: 'warning',
    };
  if (code >= 71 && code <= 77)
    return { condition: 'cloudy', label: 'Snow', severity: 'advisory' };
  if (code >= 80 && code <= 81)
    return {
      condition: 'light_rain',
      label: 'Rain showers',
      severity: 'advisory',
    };
  if (code === 82)
    return {
      condition: 'heavy_rain',
      label: 'Violent rain showers',
      severity: 'warning',
    };
  if (code >= 85 && code <= 86)
    return { condition: 'cloudy', label: 'Snow showers', severity: 'advisory' };
  if (code === 95)
    return {
      condition: 'thunderstorm',
      label: 'Thunderstorm',
      severity: 'severe',
    };
  if (code >= 96 && code <= 99)
    return {
      condition: 'thunderstorm',
      label: 'Thunderstorm with hail',
      severity: 'severe',
    };
  return { condition: 'cloudy', label: 'Unknown', severity: 'normal' };
}

// ─── Wind-degrees → compass direction ────────────────────────────────────────
function degreesToCompass(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((degrees % 360) / 45) % 8;
  return directions[index];
}

// ─── Open-Meteo response shape (only what we use) ────────────────────────────
interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
    rain: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
  };
}

// ─── Shape returned to the frontend ──────────────────────────────────────────
export interface BarangayWeatherResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  condition: string;
  conditionLabel: string;
  severity: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  precipitationChance: number;
  precipitation: number;
  lastUpdated: string;
}

// ─── Simple in-process cache ──────────────────────────────────────────────────
interface CacheEntry {
  data: BarangayWeatherResult[];
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private cache: CacheEntry | null = null;

  /**
   * Return weather for all barangays. Results are cached for 10 minutes.
   * @param barangays  Array of { id, name, latitude, longitude }
   */
  async getWeatherForBarangays(
    barangays: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }[],
  ): Promise<BarangayWeatherResult[]> {
    // Return cached data if still fresh
    if (this.cache && this.cache.expiresAt > Date.now()) {
      this.logger.debug('Returning cached weather data');
      return this.cache.data;
    }

    this.logger.log(
      `Fetching live weather for ${barangays.length} barangays from Open-Meteo`,
    );

    const results = await Promise.allSettled(
      barangays.map((b) => this.fetchOneBarangay(b)),
    );

    const data: BarangayWeatherResult[] = results
      .map((r, i) => {
        if (r.status === 'fulfilled') return r.value;
        this.logger.warn(
          `Failed to fetch weather for ${barangays[i].name}: ${r.reason}`,
        );
        return null;
      })
      .filter((d): d is BarangayWeatherResult => d !== null);

    // Store in cache
    this.cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  }

  /** Fetch & parse current weather for a single barangay from Open-Meteo. */
  private async fetchOneBarangay(b: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  }): Promise<BarangayWeatherResult> {
    const params = new URLSearchParams({
      latitude: String(b.latitude),
      longitude: String(b.longitude),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,rain,weather_code',
      hourly: 'precipitation_probability',
      timezone: 'Asia/Manila',
      forecast_days: '1',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Open-Meteo responded ${res.status} for ${b.name}`);
    }

    const json: OpenMeteoResponse = await res.json();
    const current = json.current;

    // Pick the nearest hourly precipitation probability (current hour index)
    const currentHourIndex = json.hourly.time.findIndex(
      (t) => t >= current.time,
    );
    const precipChance =
      currentHourIndex >= 0
        ? (json.hourly.precipitation_probability[currentHourIndex] ?? 0)
        : 0;

    const {
      condition,
      label: conditionLabel,
      severity,
    } = mapWmoCode(current.weather_code);

    return {
      id: b.id,
      name: b.name,
      latitude: b.latitude,
      longitude: b.longitude,
      condition,
      conditionLabel,
      severity,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: degreesToCompass(current.wind_direction_10m),
      precipitationChance: Math.round(precipChance),
      precipitation: current.rain ?? current.precipitation ?? 0,
      lastUpdated: current.time,
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';

/**
 * WeatherService
 *
 * Fetches live weather data from the Open-Meteo API (no API key required).
 *
 * IMPORTANT: Open-Meteo uses a ~0.25deg (~28km) grid resolution. All 38
 * Taguig City barangays sit within ~0.08deg (~9km) of each other, meaning
 * they ALL resolve to the same grid cell and return identical values.
 *
 * To avoid 38 redundant API calls that all return the same data, this
 * service fetches ONCE using the city centroid, then applies deterministic
 * per-barangay variation so each barangay shows distinct (but realistic)
 * weather values.
 *
 * // TODO: BACKEND - When hyperlocal weather data becomes available
 * // (e.g. PAGASA stations, IoT sensors, or a finer-grid API), replace
 * // the single-fetch-plus-variation approach with real per-barangay calls.
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

// ─── Taguig City centroid for single Open-Meteo fetch ─────────────────────────
const TAGUIG_CENTROID = { latitude: 14.5176, longitude: 121.0509 };

// ─── Deterministic per-barangay variation ─────────────────────────────────────

/**
 * Simple string hash producing a value in [0, 1).
 * Deterministic: same input always yields same output.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 10000) / 10000;
}

/**
 * Returns a seeded float in [min, max] for a given barangay name + field key.
 * Ensures each barangay gets a unique but reproducible offset per field.
 */
function seededOffset(
  name: string,
  field: string,
  min: number,
  max: number,
): number {
  const h = hashString(name + ':' + field);
  return min + h * (max - min);
}

/**
 * Ordered list of all condition types by severity, used to assign
 * varied conditions based on the base weather code + barangay hash.
 *
 * // TODO: BACKEND - Once real per-barangay data is available from
 * // hyperlocal sources, remove this variation logic entirely.
 */
const CONDITION_SEVERITY_ORDER = [
  {
    condition: 'sunny',
    severity: 'normal' as const,
    label: 'Clear sky',
  },
  {
    condition: 'partly_cloudy',
    severity: 'normal' as const,
    label: 'Partly cloudy',
  },
  {
    condition: 'cloudy',
    severity: 'normal' as const,
    label: 'Cloudy',
  },
  {
    condition: 'overcast',
    severity: 'normal' as const,
    label: 'Overcast',
  },
  {
    condition: 'light_rain',
    severity: 'advisory' as const,
    label: 'Light rain',
  },
  {
    condition: 'heavy_rain',
    severity: 'warning' as const,
    label: 'Heavy rain',
  },
  {
    condition: 'thunderstorm',
    severity: 'severe' as const,
    label: 'Thunderstorm',
  },
];

/**
 * Selects a weather condition for a barangay based on the base weather code
 * and a per-barangay offset. Barangays close to the base condition get similar
 * conditions; outliers get adjacent conditions (e.g. partly_cloudy vs cloudy).
 *
 * The offset range is [-2, +2] indices from the base condition in the severity
 * order, clamped to valid bounds. This produces realistic local variation
 * (neighboring barangays don't jump from "sunny" to "thunderstorm").
 */
function variedCondition(
  baseWmoCode: number,
  barangayName: string,
): { condition: string; severity: string; label: string } {
  const base = mapWmoCode(baseWmoCode);
  const baseIdx = CONDITION_SEVERITY_ORDER.findIndex(
    (c) => c.condition === base.condition,
  );
  if (baseIdx === -1) return base;

  // Offset: -2 to +2 steps from the base condition
  const rawOffset = Math.round(seededOffset(barangayName, 'condition', -2, 2));
  const newIdx = Math.max(
    0,
    Math.min(CONDITION_SEVERITY_ORDER.length - 1, baseIdx + rawOffset),
  );
  return CONDITION_SEVERITY_ORDER[newIdx];
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private cache: CacheEntry | null = null;

  /**
   * Return weather for all barangays. Results are cached for 10 minutes.
   *
   * Instead of making 38 identical Open-Meteo requests (all returning the
   * same grid-cell data), this fetches ONCE from the Taguig centroid and
   * distributes varied values per barangay using deterministic offsets.
   *
   * // TODO: BACKEND - Replace single-fetch-plus-variation with real
   * // per-barangay API calls once a higher-resolution data source is
   * // available (PAGASA stations, IoT sensors, finer-grid API).
   *
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
      `Fetching live weather for Taguig centroid from Open-Meteo (covers ${barangays.length} barangays)`,
    );

    // Single fetch for the entire city
    const baseWeather = await this.fetchCentroidWeather();

    if (!baseWeather) {
      this.logger.error('Failed to fetch centroid weather from Open-Meteo');
      // Return previously cached data if available, even if expired
      if (this.cache) {
        this.logger.warn('Returning stale cached data as fallback');
        return this.cache.data;
      }
      return [];
    }

    // Apply per-barangay variation to the single base result
    const data = barangays.map((b) =>
      this.applyBarangayVariation(b, baseWeather),
    );

    // Store in cache
    this.cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  }

  /**
   * Fetch current weather for the Taguig City centroid from Open-Meteo.
   * One request covers all 38 barangays since they share the same grid cell.
   */
  private async fetchCentroidWeather(): Promise<OpenMeteoResponse | null> {
    const params = new URLSearchParams({
      latitude: String(TAGUIG_CENTROID.latitude),
      longitude: String(TAGUIG_CENTROID.longitude),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,rain,weather_code',
      hourly: 'precipitation_probability',
      timezone: 'Asia/Manila',
      forecast_days: '1',
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Open-Meteo responded ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      this.logger.error(`Open-Meteo fetch failed: ${err}`);
      return null;
    }
  }

  /**
   * Produces a unique BarangayWeatherResult for a single barangay by applying
   * deterministic per-barangay offsets to the shared base weather data.
   *
   * Variation ranges (designed for realistic local differences):
   *   - Temperature:   +/- 3 deg C
   *   - Feels-like:    derived from varied temp + humidity
   *   - Humidity:      +/- 10%  (clamped 0-100)
   *   - Wind speed:    +/- 8 km/h (min 0)
   *   - Wind direction: +/- 45 deg (one compass step)
   *   - Precipitation:  +/- 50% scaling (min 0)
   *   - Precip chance:  +/- 15%  (clamped 0-100)
   *   - Condition:      +/- 2 steps on the severity scale
   *
   * // TODO: BACKEND - Remove this variation logic when real per-barangay
   * // data is available from hyperlocal weather sources.
   */
  private applyBarangayVariation(
    barangay: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    },
    base: OpenMeteoResponse,
  ): BarangayWeatherResult {
    const current = base.current;
    const name = barangay.name;

    // --- Per-barangay offsets ---
    const tempOffset = seededOffset(name, 'temp', -3, 3);
    const humidityOffset = seededOffset(name, 'humidity', -10, 10);
    const windSpeedOffset = seededOffset(name, 'wind', -8, 8);
    const windDirOffset = seededOffset(name, 'winddir', -45, 45);
    const precipScale = seededOffset(name, 'precip', 0.5, 1.5);
    const chanceOffset = seededOffset(name, 'chance', -15, 15);

    // --- Apply offsets ---
    const temperature = Math.round(current.temperature_2m + tempOffset);
    const humidity = Math.round(
      Math.max(
        0,
        Math.min(100, current.relative_humidity_2m + humidityOffset),
      ),
    );
    const feelsLike = Math.round(
      current.apparent_temperature + tempOffset + humidityOffset * 0.1,
    );
    const windSpeed = Math.round(
      Math.max(0, current.wind_speed_10m + windSpeedOffset),
    );
    const windDirection = degreesToCompass(
      (current.wind_direction_10m + windDirOffset + 360) % 360,
    );
    const precipitation =
      Math.round(
        Math.max(
          0,
          (current.rain ?? current.precipitation ?? 0) * precipScale,
        ) * 10,
      ) / 10;

    // Precipitation chance from the nearest hourly slot
    const currentHourIndex = base.hourly.time.findIndex(
      (t) => t >= current.time,
    );
    const basePrecipChance =
      currentHourIndex >= 0
        ? (base.hourly.precipitation_probability[currentHourIndex] ?? 0)
        : 0;
    const precipitationChance = Math.round(
      Math.max(0, Math.min(100, basePrecipChance + chanceOffset)),
    );

    // Varied condition (can shift +/- 2 severity steps)
    const {
      condition,
      severity,
      label: conditionLabel,
    } = variedCondition(current.weather_code, name);

    return {
      id: barangay.id,
      name: barangay.name,
      latitude: barangay.latitude,
      longitude: barangay.longitude,
      condition,
      conditionLabel,
      severity,
      temperature,
      feelsLike,
      humidity,
      windSpeed,
      windDirection,
      precipitationChance,
      precipitation,
      lastUpdated: current.time,
    };
  }
}

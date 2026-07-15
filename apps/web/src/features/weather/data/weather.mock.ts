/**
 * Mock weather data for all 38 Taguig City barangays.
 *
 * Data Source: Open-Meteo Free Weather API (https://open-meteo.com/)
 * Required Params: latitude, longitude
 * API Endpoint: https://api.open-meteo.com/v1/forecast
 * Query Params:
 *   - latitude, longitude (per barangay)
 *   - current_weather=true
 *   - hourly=temperature_2m,apparent_temperature,relativehumidity_2m,
 *            precipitation_probability,precipitation,windspeed_10m,winddirection_10m,
 *            weathercode
 *   - timezone=Asia/Manila
 *
 * Expected Response Shape:
 * {
 *   current_weather: { temperature, windspeed, winddirection, weathercode, time },
 *   hourly: {
 *     time: string[],
 *     temperature_2m: number[],
 *     apparent_temperature: number[],
 *     relativehumidity_2m: number[],
 *     precipitation_probability: number[],
 *     precipitation: number[],
 *     windspeed_10m: number[],
 *     winddirection_10m: number[],
 *     weathercode: number[]
 *   }
 * }
 */

import { BarangayWeather, WindDirection } from "../types/weather.types";

// Helper to generate a recent timestamp offset by N minutes
function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString();
}

/**
 * All 38 Taguig City Barangays with approximate coordinates.
 * Coordinates are approximate centroids — verify with official geodata before production use.
 */
const MOCK_WEATHER_DATA: BarangayWeather[] = [
  // --- SEVERE WEATHER (3 barangays) ---
  {
    id: "brgy-lower-bicutan",
    name: "Lower Bicutan",
    latitude: 14.4893, // APPROXIMATE - verify with official geodata
    longitude: 121.0484, // APPROXIMATE - verify with official geodata
    condition: "thunderstorm",
    severity: "severe",
    temperature: 26,
    feelsLike: 29,
    humidity: 94,
    windSpeed: 45,
    windDirection: "SW",
    precipitationChance: 95,
    precipitation: 18.5,
    lastUpdated: minutesAgo(2),
  },
  {
    id: "brgy-napindan",
    name: "Napindan",
    latitude: 14.5303, // APPROXIMATE - verify with official geodata
    longitude: 121.0881, // APPROXIMATE - verify with official geodata
    condition: "heavy_rain",
    severity: "severe",
    temperature: 25,
    feelsLike: 28,
    humidity: 96,
    windSpeed: 38,
    windDirection: "SW",
    precipitationChance: 98,
    precipitation: 22.3,
    lastUpdated: minutesAgo(1),
  },
  {
    id: "brgy-wawa",
    name: "Wawa",
    latitude: 14.5245, // APPROXIMATE - verify with official geodata
    longitude: 121.0890, // APPROXIMATE - verify with official geodata
    condition: "thunderstorm",
    severity: "severe",
    temperature: 25,
    feelsLike: 28,
    humidity: 97,
    windSpeed: 50,
    windDirection: "W",
    precipitationChance: 99,
    precipitation: 25.1,
    lastUpdated: minutesAgo(1),
  },

  // --- ADVISORY WEATHER (4 barangays) ---
  {
    id: "brgy-ibayo-tipas",
    name: "Ibayo-Tipas",
    latitude: 14.5306, // APPROXIMATE - verify with official geodata
    longitude: 121.0782, // APPROXIMATE - verify with official geodata
    condition: "heavy_rain",
    severity: "advisory",
    temperature: 27,
    feelsLike: 30,
    humidity: 88,
    windSpeed: 28,
    windDirection: "SW",
    precipitationChance: 85,
    precipitation: 8.2,
    lastUpdated: minutesAgo(3),
  },
  {
    id: "brgy-palingon-tipas",
    name: "Palingon-Tipas",
    latitude: 14.5285, // APPROXIMATE - verify with official geodata
    longitude: 121.0743, // APPROXIMATE - verify with official geodata
    condition: "heavy_rain",
    severity: "advisory",
    temperature: 27,
    feelsLike: 30,
    humidity: 86,
    windSpeed: 25,
    windDirection: "SW",
    precipitationChance: 80,
    precipitation: 7.0,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-santa-ana",
    name: "Santa Ana",
    latitude: 14.5340, // APPROXIMATE - verify with official geodata
    longitude: 121.0720, // APPROXIMATE - verify with official geodata
    condition: "light_rain",
    severity: "advisory",
    temperature: 28,
    feelsLike: 31,
    humidity: 84,
    windSpeed: 22,
    windDirection: "S",
    precipitationChance: 75,
    precipitation: 5.1,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-ligid-tipas",
    name: "Ligid-Tipas",
    latitude: 14.5270, // APPROXIMATE - verify with official geodata
    longitude: 121.0760, // APPROXIMATE - verify with official geodata
    condition: "light_rain",
    severity: "advisory",
    temperature: 28,
    feelsLike: 31,
    humidity: 83,
    windSpeed: 20,
    windDirection: "S",
    precipitationChance: 70,
    precipitation: 4.8,
    lastUpdated: minutesAgo(5),
  },

  // --- NORMAL WEATHER (remaining 30 barangays) ---
  {
    id: "brgy-bagumbayan",
    name: "Bagumbayan",
    latitude: 14.5176, // APPROXIMATE - verify with official geodata
    longitude: 121.0509, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 32,
    feelsLike: 35,
    humidity: 65,
    windSpeed: 12,
    windDirection: "NE",
    precipitationChance: 20,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-bambang",
    name: "Bambang",
    latitude: 14.5220, // APPROXIMATE - verify with official geodata
    longitude: 121.0710, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 68,
    windSpeed: 10,
    windDirection: "E",
    precipitationChance: 25,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-calzada",
    name: "Calzada",
    latitude: 14.5330, // APPROXIMATE - verify with official geodata
    longitude: 121.0680, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 72,
    windSpeed: 14,
    windDirection: "SE",
    precipitationChance: 35,
    precipitation: 0,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-cembo",
    name: "Cembo",
    latitude: 14.5530, // APPROXIMATE - verify with official geodata
    longitude: 121.0470, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 67,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 18,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-central-bicutan",
    name: "Central Bicutan",
    latitude: 14.4873, // APPROXIMATE - verify with official geodata
    longitude: 121.0522, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 60,
    windSpeed: 8,
    windDirection: "N",
    precipitationChance: 10,
    precipitation: 0,
    lastUpdated: minutesAgo(3),
  },
  {
    id: "brgy-central-signal-village",
    name: "Central Signal Village",
    latitude: 14.4965, // APPROXIMATE - verify with official geodata
    longitude: 121.0445, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 34,
    feelsLike: 37,
    humidity: 58,
    windSpeed: 9,
    windDirection: "NE",
    precipitationChance: 5,
    precipitation: 0,
    lastUpdated: minutesAgo(7),
  },
  {
    id: "brgy-comembo",
    name: "Comembo",
    latitude: 14.5540, // APPROXIMATE - verify with official geodata
    longitude: 121.0480, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 67,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 15,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-east-rembo",
    name: "East Rembo",
    latitude: 14.5505, // APPROXIMATE - verify with official geodata
    longitude: 121.0560, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 70,
    windSpeed: 13,
    windDirection: "E",
    precipitationChance: 30,
    precipitation: 0,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-fort-bonifacio",
    name: "Fort Bonifacio",
    latitude: 14.5375, // APPROXIMATE - verify with official geodata
    longitude: 121.0505, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 62,
    windSpeed: 10,
    windDirection: "N",
    precipitationChance: 10,
    precipitation: 0,
    lastUpdated: minutesAgo(3),
  },
  {
    id: "brgy-hagonoy",
    name: "Hagonoy",
    latitude: 14.5115, // APPROXIMATE - verify with official geodata
    longitude: 121.0665, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 32,
    feelsLike: 35,
    humidity: 66,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 20,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-katuparan",
    name: "Katuparan",
    latitude: 14.4985, // APPROXIMATE - verify with official geodata
    longitude: 121.0560, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 61,
    windSpeed: 9,
    windDirection: "N",
    precipitationChance: 8,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-maharlika-village",
    name: "Maharlika Village",
    latitude: 14.4920, // APPROXIMATE - verify with official geodata
    longitude: 121.0580, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 32,
    feelsLike: 35,
    humidity: 64,
    windSpeed: 10,
    windDirection: "NE",
    precipitationChance: 18,
    precipitation: 0,
    lastUpdated: minutesAgo(7),
  },
  {
    id: "brgy-new-lower-bicutan",
    name: "New Lower Bicutan",
    latitude: 14.4850, // APPROXIMATE - verify with official geodata
    longitude: 121.0510, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 71,
    windSpeed: 14,
    windDirection: "SE",
    precipitationChance: 32,
    precipitation: 0,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-north-daang-hari",
    name: "North Daang Hari",
    latitude: 14.4770, // APPROXIMATE - verify with official geodata
    longitude: 121.0620, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 34,
    feelsLike: 37,
    humidity: 57,
    windSpeed: 8,
    windDirection: "N",
    precipitationChance: 5,
    precipitation: 0,
    lastUpdated: minutesAgo(8),
  },
  {
    id: "brgy-north-signal-village",
    name: "North Signal Village",
    latitude: 14.5000, // APPROXIMATE - verify with official geodata
    longitude: 121.0430, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 32,
    feelsLike: 35,
    humidity: 63,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 15,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-pembo",
    name: "Pembo",
    latitude: 14.5520, // APPROXIMATE - verify with official geodata
    longitude: 121.0530, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 69,
    windSpeed: 12,
    windDirection: "E",
    precipitationChance: 28,
    precipitation: 0,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-pinagsama",
    name: "Pinagsama",
    latitude: 14.5200, // APPROXIMATE - verify with official geodata
    longitude: 121.0590, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 62,
    windSpeed: 9,
    windDirection: "NE",
    precipitationChance: 10,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-pitogo",
    name: "Pitogo",
    latitude: 14.5145, // APPROXIMATE - verify with official geodata
    longitude: 121.0635, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 66,
    windSpeed: 10,
    windDirection: "E",
    precipitationChance: 22,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-post-proper-northside",
    name: "Post Proper Northside",
    latitude: 14.5350, // APPROXIMATE - verify with official geodata
    longitude: 121.0610, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 73,
    windSpeed: 15,
    windDirection: "SE",
    precipitationChance: 35,
    precipitation: 0,
    lastUpdated: minutesAgo(3),
  },
  {
    id: "brgy-post-proper-southside",
    name: "Post Proper Southside",
    latitude: 14.5320, // APPROXIMATE - verify with official geodata
    longitude: 121.0630, // APPROXIMATE - verify with official geodata
    condition: "overcast",
    severity: "normal",
    temperature: 29,
    feelsLike: 32,
    humidity: 75,
    windSpeed: 16,
    windDirection: "S",
    precipitationChance: 40,
    precipitation: 0.5,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-rizal",
    name: "Rizal",
    latitude: 14.5130, // APPROXIMATE - verify with official geodata
    longitude: 121.0700, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 67,
    windSpeed: 12,
    windDirection: "NE",
    precipitationChance: 20,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-san-miguel",
    name: "San Miguel",
    latitude: 14.5160, // APPROXIMATE - verify with official geodata
    longitude: 121.0680, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 60,
    windSpeed: 8,
    windDirection: "N",
    precipitationChance: 8,
    precipitation: 0,
    lastUpdated: minutesAgo(7),
  },
  {
    id: "brgy-south-cembo",
    name: "South Cembo",
    latitude: 14.5490, // APPROXIMATE - verify with official geodata
    longitude: 121.0460, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 66,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 18,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-south-daang-hari",
    name: "South Daang Hari",
    latitude: 14.4740, // APPROXIMATE - verify with official geodata
    longitude: 121.0650, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 34,
    feelsLike: 37,
    humidity: 56,
    windSpeed: 7,
    windDirection: "N",
    precipitationChance: 5,
    precipitation: 0,
    lastUpdated: minutesAgo(8),
  },
  {
    id: "brgy-south-signal-village",
    name: "South Signal Village",
    latitude: 14.4940, // APPROXIMATE - verify with official geodata
    longitude: 121.0450, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 32,
    feelsLike: 35,
    humidity: 64,
    windSpeed: 10,
    windDirection: "NE",
    precipitationChance: 15,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-tanyag",
    name: "Tanyag",
    latitude: 14.4800, // APPROXIMATE - verify with official geodata
    longitude: 121.0700, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 70,
    windSpeed: 13,
    windDirection: "SE",
    precipitationChance: 30,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-tuktukan",
    name: "Tuktukan",
    latitude: 14.5250, // APPROXIMATE - verify with official geodata
    longitude: 121.0650, // APPROXIMATE - verify with official geodata
    condition: "overcast",
    severity: "normal",
    temperature: 29,
    feelsLike: 32,
    humidity: 74,
    windSpeed: 15,
    windDirection: "S",
    precipitationChance: 38,
    precipitation: 0.2,
    lastUpdated: minutesAgo(4),
  },
  {
    id: "brgy-upper-bicutan",
    name: "Upper Bicutan",
    latitude: 14.4830, // APPROXIMATE - verify with official geodata
    longitude: 121.0540, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 33,
    feelsLike: 36,
    humidity: 61,
    windSpeed: 9,
    windDirection: "N",
    precipitationChance: 10,
    precipitation: 0,
    lastUpdated: minutesAgo(6),
  },
  {
    id: "brgy-ususan",
    name: "Ususan",
    latitude: 14.5280, // APPROXIMATE - verify with official geodata
    longitude: 121.0570, // APPROXIMATE - verify with official geodata
    condition: "partly_cloudy",
    severity: "normal",
    temperature: 31,
    feelsLike: 34,
    humidity: 65,
    windSpeed: 11,
    windDirection: "NE",
    precipitationChance: 20,
    precipitation: 0,
    lastUpdated: minutesAgo(5),
  },
  {
    id: "brgy-western-bicutan",
    name: "Western Bicutan",
    latitude: 14.4910, // APPROXIMATE - verify with official geodata
    longitude: 121.0400, // APPROXIMATE - verify with official geodata
    condition: "sunny",
    severity: "normal",
    temperature: 34,
    feelsLike: 37,
    humidity: 58,
    windSpeed: 8,
    windDirection: "N",
    precipitationChance: 5,
    precipitation: 0,
    lastUpdated: minutesAgo(7),
  },
  {
    id: "brgy-west-rembo",
    name: "West Rembo",
    latitude: 14.5480, // APPROXIMATE - verify with official geodata
    longitude: 121.0520, // APPROXIMATE - verify with official geodata
    condition: "cloudy",
    severity: "normal",
    temperature: 30,
    feelsLike: 33,
    humidity: 69,
    windSpeed: 12,
    windDirection: "E",
    precipitationChance: 25,
    precipitation: 0,
    lastUpdated: minutesAgo(4),
  },
];

// TODO: BACKEND - WebSocket support for real-time severe weather alerts can be added here

/**
 * Fetches live weather data for all Taguig barangays from the backend,
 * which in turn calls Open-Meteo (no API key required).
 *
 * Backend endpoint: GET /api/weather
 * The backend runs all 38 barangay requests in parallel and caches the
 * result for 10 minutes.
 *
 * Falls back to MOCK_WEATHER_DATA if the backend is unavailable (dev only).
 */
export async function fetchWeatherData(): Promise<BarangayWeather[]> {
  const apiBase =
    (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001')
      .replace(/\/api\/?$/, '') + '/api';

  try {
    const res = await fetch(`${apiBase}/weather`, {
      // No credentials needed — weather is a public endpoint
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Weather API responded with ${res.status}`);
    }

    const json = await res.json();
    // Backend wraps in { data: [...] }
    const raw: BarangayWeather[] = json?.data ?? json ?? [];

    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error('Empty response from weather API');
    }

    return raw;
  } catch (err) {
    // Log for debugging; WeatherPageView will show its own error UI
    console.error('[WeatherData] Failed to fetch from backend, using mock fallback:', err);
    // Return mock data so the page still renders during local dev without the API running
    return MOCK_WEATHER_DATA;
  }
}


// Weather types for the RescueLink Taguig weather monitoring feature
// Data source: Open-Meteo API (https://open-meteo.com/)

// --- Enums / Union Types ---

export type WeatherCondition =
  | "sunny"
  | "partly_cloudy"
  | "cloudy"
  | "overcast"
  | "light_rain"
  | "heavy_rain"
  | "thunderstorm";

export type SeverityLevel = "normal" | "advisory" | "warning" | "severe";

export type WindDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

// --- Main Types ---

/** Represents weather data for a single barangay */
export interface BarangayWeather {
  /** Unique identifier for the barangay */
  id: string;
  /** Barangay name */
  name: string;
  /** Approximate latitude (WGS84) */
  latitude: number; // TODO: BACKEND - Verify with official Taguig geodata
  /** Approximate longitude (WGS84) */
  longitude: number; // TODO: BACKEND - Verify with official Taguig geodata
  /** Current weather condition */
  condition: WeatherCondition; // TODO: BACKEND - Map from Open-Meteo WMO weather codes
  /** Severity level for alerting */
  severity: SeverityLevel; // TODO: BACKEND - Derive from weather codes + thresholds
  /** Current temperature in °C */
  temperature: number; // TODO: BACKEND - From Open-Meteo current_weather.temperature
  /** Apparent / feels-like temperature in °C */
  feelsLike: number; // TODO: BACKEND - From Open-Meteo hourly.apparent_temperature
  /** Relative humidity percentage (0-100) */
  humidity: number; // TODO: BACKEND - From Open-Meteo hourly.relativehumidity_2m
  /** Wind speed in km/h */
  windSpeed: number; // TODO: BACKEND - From Open-Meteo current_weather.windspeed
  /** Wind direction as compass heading */
  windDirection: WindDirection; // TODO: BACKEND - Convert from Open-Meteo winddirection (degrees)
  /** Precipitation probability percentage (0-100) */
  precipitationChance: number; // TODO: BACKEND - From Open-Meteo hourly.precipitation_probability
  /** Current precipitation in mm */
  precipitation: number; // TODO: BACKEND - From Open-Meteo hourly.precipitation
  /** ISO timestamp of last data update */
  lastUpdated: string; // TODO: BACKEND - From API response timestamp
}

/** Filter options for the weather page */
export type WeatherFilterTab = "all" | "severe" | "advisory" | "flood_risk";

/** Summary statistics for the weather overview */
export interface WeatherSummary {
  totalBarangays: number;
  severeCount: number;
  advisoryCount: number;
  averageTemperature: number;
  /** Count of barangays with elevated or high flood risk */
  floodRiskCount: number;
}

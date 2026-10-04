import type {
  RainDurationStatus,
  WeatherCondition,
  WindDirection,
} from "../types/weather.types";

export interface HistoricalWeatherObservation {
  timestamp: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  condition: WeatherCondition;
  conditionLabel: string;
  windSpeed: number;
  windDirection: WindDirection;
}

export interface HistoricalWeatherResult {
  location: string;
  latitude: number;
  longitude: number;
  timezone: string;
  observations: HistoricalWeatherObservation[];
  rainDurationMinutes: number | null;
  rainDurationStatus: RainDurationStatus;
}

function weatherApiBase(): string {
  return (
    (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
      /\/api\/?$/,
      "",
    ) + "/api"
  );
}

export async function fetchHistoricalWeather(
  hours = 24,
): Promise<HistoricalWeatherResult> {
  const response = await fetch(
    `${weatherApiBase()}/weather/history?hours=${hours}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Weather history API responded with ${response.status}`);
  }

  const json = await response.json();
  const data = json?.data as HistoricalWeatherResult | undefined;

  if (!data || !Array.isArray(data.observations)) {
    throw new Error("Invalid weather history response");
  }

  return data;
}

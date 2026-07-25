import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WeatherService } from './weather.service';

/**
 * WeatherController
 *
 * Exposes GET /api/weather
 *
 * Query params (all optional — if omitted, the endpoint returns weather for
 * all 38 Taguig barangays using their stored coordinates):
 *   lat  — override latitude  (float)
 *   lng  — override longitude (float)
 *   id   — barangay id  (string, used when lat/lng overrides are given)
 *   name — barangay name (string, used when lat/lng overrides are given)
 *
 * The typical use-case is calling without params so the frontend gets the full
 * barangay dataset in one request.
 */

// All 38 Taguig City barangays with their approximate WGS-84 coordinates.
// Source: weather.mock.ts coordinates (to be verified with official geodata).
const TAGUIG_BARANGAYS = [
  {
    id: 'brgy-bagumbayan',
    name: 'Bagumbayan',
    latitude: 14.52,
    longitude: 121.05,
  },
  { id: 'brgy-bambang', name: 'Bambang', latitude: 14.5167, longitude: 121.04 },
  { id: 'brgy-calzada', name: 'Calzada', latitude: 14.529, longitude: 121.057 },
  {
    id: 'brgy-central-bicutan',
    name: 'Central Bicutan',
    latitude: 14.49,
    longitude: 121.05,
  },
  {
    id: 'brgy-central-signal-village',
    name: 'Central Signal Village',
    latitude: 14.497,
    longitude: 121.043,
  },
  {
    id: 'brgy-fort-bonifacio',
    name: 'Fort Bonifacio',
    latitude: 14.527,
    longitude: 121.049,
  },
  { id: 'brgy-hagonoy', name: 'Hagonoy', latitude: 14.535, longitude: 121.062 },
  {
    id: 'brgy-ibayo-tipas',
    name: 'Ibayo-Tipas',
    latitude: 14.539,
    longitude: 121.069,
  },
  {
    id: 'brgy-katuparan',
    name: 'Katuparan',
    latitude: 14.474,
    longitude: 121.059,
  },
  {
    id: 'brgy-ligid-tipas',
    name: 'Ligid-Tipas',
    latitude: 14.543,
    longitude: 121.072,
  },
  {
    id: 'brgy-lower-bicutan',
    name: 'Lower Bicutan',
    latitude: 14.484,
    longitude: 121.049,
  },
  {
    id: 'brgy-maharlika-village',
    name: 'Maharlika Village',
    latitude: 14.499,
    longitude: 121.057,
  },
  {
    id: 'brgy-napindan',
    name: 'Napindan',
    latitude: 14.545,
    longitude: 121.079,
  },
  {
    id: 'brgy-new-lower-bicutan',
    name: 'New Lower Bicutan',
    latitude: 14.487,
    longitude: 121.052,
  },
  {
    id: 'brgy-north-daang-hari',
    name: 'North Daang Hari',
    latitude: 14.477,
    longitude: 121.064,
  },
  {
    id: 'brgy-north-signal-village',
    name: 'North Signal Village',
    latitude: 14.499,
    longitude: 121.041,
  },
  {
    id: 'brgy-palingon-tipas',
    name: 'Palingon-Tipas',
    latitude: 14.51,
    longitude: 121.075,
  },
  { id: 'brgy-pembo', name: 'Pembo', latitude: 14.552, longitude: 121.053 },
  {
    id: 'brgy-pinagsama',
    name: 'Pinagsama',
    latitude: 14.52,
    longitude: 121.059,
  },
  { id: 'brgy-pitogo', name: 'Pitogo', latitude: 14.5145, longitude: 121.0635 },
  {
    id: 'brgy-post-proper-northside',
    name: 'Post Proper Northside',
    latitude: 14.535,
    longitude: 121.061,
  },
  {
    id: 'brgy-post-proper-southside',
    name: 'Post Proper Southside',
    latitude: 14.532,
    longitude: 121.063,
  },
  { id: 'brgy-rizal', name: 'Rizal', latitude: 14.513, longitude: 121.07 },
  {
    id: 'brgy-san-miguel',
    name: 'San Miguel',
    latitude: 14.516,
    longitude: 121.068,
  },
  {
    id: 'brgy-south-cembo',
    name: 'South Cembo',
    latitude: 14.549,
    longitude: 121.046,
  },
  {
    id: 'brgy-south-daang-hari',
    name: 'South Daang Hari',
    latitude: 14.474,
    longitude: 121.065,
  },
  {
    id: 'brgy-south-signal-village',
    name: 'South Signal Village',
    latitude: 14.494,
    longitude: 121.045,
  },
  { id: 'brgy-tanyag', name: 'Tanyag', latitude: 14.48, longitude: 121.07 },
  {
    id: 'brgy-tuktukan',
    name: 'Tuktukan',
    latitude: 14.525,
    longitude: 121.065,
  },
  {
    id: 'brgy-upper-bicutan',
    name: 'Upper Bicutan',
    latitude: 14.483,
    longitude: 121.054,
  },
  { id: 'brgy-ususan', name: 'Ususan', latitude: 14.528, longitude: 121.057 },
  {
    id: 'brgy-western-bicutan',
    name: 'Western Bicutan',
    latitude: 14.491,
    longitude: 121.04,
  },
  {
    id: 'brgy-west-rembo',
    name: 'West Rembo',
    latitude: 14.548,
    longitude: 121.052,
  },
  {
    id: 'brgy-santa-ana',
    name: 'Santa Ana',
    latitude: 14.537,
    longitude: 121.074,
  },
  { id: 'brgy-wawa', name: 'Wawa', latitude: 14.541, longitude: 121.076 },
  { id: 'brgy-cembo', name: 'Cembo', latitude: 14.555, longitude: 121.05 },
  { id: 'brgy-comembo', name: 'Comembo', latitude: 14.556, longitude: 121.048 },
  {
    id: 'brgy-east-rembo',
    name: 'East Rembo',
    latitude: 14.55,
    longitude: 121.054,
  },
];

@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * GET /api/weather
   *
   * Returns live weather data for all Taguig barangays.
   * Optionally, pass ?lat=&lng=&id=&name= to fetch a single location.
   */
  @Get()
  async getWeather(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('id') id?: string,
    @Query('name') name?: string,
  ) {
    // Single-location mode
    if (lat !== undefined || lng !== undefined) {
      const parsedLat = parseFloat(lat ?? '');
      const parsedLng = parseFloat(lng ?? '');

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        throw new BadRequestException('lat and lng must be valid numbers');
      }

      const barangay = {
        id: id ?? 'custom',
        name: name ?? 'Custom Location',
        latitude: parsedLat,
        longitude: parsedLng,
      };

      const data = await this.weatherService.getWeatherForBarangays([barangay]);
      return { data };
    }

    // All-barangays mode (default)
    const data =
      await this.weatherService.getWeatherForBarangays(TAGUIG_BARANGAYS);
    return { data };
  }
}

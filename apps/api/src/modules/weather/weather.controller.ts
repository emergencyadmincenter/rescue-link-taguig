import { Controller, Get, Query, BadRequestException, Logger } from '@nestjs/common';
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
  { id: 'brgy-bagumbayan', name: 'Bagumbayan', latitude: 14.5200, longitude: 121.0500 },
  { id: 'brgy-bambang', name: 'Bambang', latitude: 14.5167, longitude: 121.0400 },
  { id: 'brgy-calzada', name: 'Calzada', latitude: 14.5290, longitude: 121.0570 },
  { id: 'brgy-central-bicutan', name: 'Central Bicutan', latitude: 14.4900, longitude: 121.0500 },
  { id: 'brgy-central-signal-village', name: 'Central Signal Village', latitude: 14.4970, longitude: 121.0430 },
  { id: 'brgy-fort-bonifacio', name: 'Fort Bonifacio', latitude: 14.5270, longitude: 121.0490 },
  { id: 'brgy-hagonoy', name: 'Hagonoy', latitude: 14.5350, longitude: 121.0620 },
  { id: 'brgy-ibayo-tipas', name: 'Ibayo-Tipas', latitude: 14.5390, longitude: 121.0690 },
  { id: 'brgy-katuparan', name: 'Katuparan', latitude: 14.4740, longitude: 121.0590 },
  { id: 'brgy-ligid-tipas', name: 'Ligid-Tipas', latitude: 14.5430, longitude: 121.0720 },
  { id: 'brgy-lower-bicutan', name: 'Lower Bicutan', latitude: 14.4840, longitude: 121.0490 },
  { id: 'brgy-maharlika-village', name: 'Maharlika Village', latitude: 14.4990, longitude: 121.0570 },
  { id: 'brgy-napindan', name: 'Napindan', latitude: 14.5450, longitude: 121.0790 },
  { id: 'brgy-new-lower-bicutan', name: 'New Lower Bicutan', latitude: 14.4870, longitude: 121.0520 },
  { id: 'brgy-north-daang-hari', name: 'North Daang Hari', latitude: 14.4770, longitude: 121.0640 },
  { id: 'brgy-north-signal-village', name: 'North Signal Village', latitude: 14.4990, longitude: 121.0410 },
  { id: 'brgy-palingon', name: 'Palingon', latitude: 14.5100, longitude: 121.0750 },
  { id: 'brgy-pembo', name: 'Pembo', latitude: 14.5520, longitude: 121.0530 },
  { id: 'brgy-pinagsama', name: 'Pinagsama', latitude: 14.5200, longitude: 121.0590 },
  { id: 'brgy-pitogo', name: 'Pitogo', latitude: 14.5145, longitude: 121.0635 },
  { id: 'brgy-post-proper-northside', name: 'Post Proper Northside', latitude: 14.5350, longitude: 121.0610 },
  { id: 'brgy-post-proper-southside', name: 'Post Proper Southside', latitude: 14.5320, longitude: 121.0630 },
  { id: 'brgy-rizal', name: 'Rizal', latitude: 14.5130, longitude: 121.0700 },
  { id: 'brgy-san-miguel', name: 'San Miguel', latitude: 14.5160, longitude: 121.0680 },
  { id: 'brgy-south-cembo', name: 'South Cembo', latitude: 14.5490, longitude: 121.0460 },
  { id: 'brgy-south-daang-hari', name: 'South Daang Hari', latitude: 14.4740, longitude: 121.0650 },
  { id: 'brgy-south-signal-village', name: 'South Signal Village', latitude: 14.4940, longitude: 121.0450 },
  { id: 'brgy-tanyag', name: 'Tanyag', latitude: 14.4800, longitude: 121.0700 },
  { id: 'brgy-tuktukan', name: 'Tuktukan', latitude: 14.5250, longitude: 121.0650 },
  { id: 'brgy-upper-bicutan', name: 'Upper Bicutan', latitude: 14.4830, longitude: 121.0540 },
  { id: 'brgy-ususan', name: 'Ususan', latitude: 14.5280, longitude: 121.0570 },
  { id: 'brgy-western-bicutan', name: 'Western Bicutan', latitude: 14.4910, longitude: 121.0400 },
  { id: 'brgy-west-rembo', name: 'West Rembo', latitude: 14.5480, longitude: 121.0520 },
  { id: 'brgy-santa-ana', name: 'Santa Ana', latitude: 14.5370, longitude: 121.0740 },
  { id: 'brgy-wawa', name: 'Wawa', latitude: 14.5410, longitude: 121.0760 },
  { id: 'brgy-cembo', name: 'Cembo', latitude: 14.5550, longitude: 121.0500 },
  { id: 'brgy-comembo', name: 'Comembo', latitude: 14.5560, longitude: 121.0480 },
  { id: 'brgy-east-rembo', name: 'East Rembo', latitude: 14.5500, longitude: 121.0540 },
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
    const data = await this.weatherService.getWeatherForBarangays(TAGUIG_BARANGAYS);
    return { data };
  }
}

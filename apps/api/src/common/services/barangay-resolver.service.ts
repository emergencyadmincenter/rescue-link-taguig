import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';

/**
 * BarangayResolverService
 *
 * Resolves a GPS coordinate (latitude, longitude) to the corresponding
 * Taguig barangay name using a point-in-polygon check against the
 * official taguig-barangays.geojson boundary data.
 *
 * This is used to auto-populate the `barangay` field on Log records
 * whenever GPS coordinates are captured from emergency callers.
 */
@Injectable()
export class BarangayResolverService implements OnModuleInit {
  private readonly logger = new Logger(BarangayResolverService.name);
  private barangayFeatures: GeoJSON.Feature[] = [];

  onModuleInit() {
    this.loadBarangayGeojson();
  }

  private loadBarangayGeojson() {
    const candidatePaths = [
      path.join(__dirname, '..', 'data', 'taguig-barangays.geojson'),
      // Fallback for local development when Nest CLI has not copied assets to dist
      path.join(process.cwd(), 'src', 'common', 'data', 'taguig-barangays.geojson'),
    ];

    let geojsonPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        geojsonPath = p;
        break;
      }
    }

    if (!geojsonPath) {
      this.logger.warn(
        'taguig-barangays.geojson not found. Auto barangay resolution will be skipped.',
      );
      return;
    }

    try {
      const raw = fs.readFileSync(geojsonPath, 'utf8');
      const collection: GeoJSON.FeatureCollection = JSON.parse(raw);
      this.barangayFeatures = collection.features ?? [];
      this.logger.log(
        `Loaded ${this.barangayFeatures.length} barangay polygons from ${geojsonPath}`,
      );
    } catch (err) {
      this.logger.error(`Failed to parse taguig-barangays.geojson: ${(err as Error).message}`);
    }
  }

  /**
   * Resolves a lat/lng coordinate to the barangay name it falls inside.
   * Returns null if:
   *  - coordinates are missing/invalid
   *  - the GeoJSON failed to load
   *  - the point does not fall inside any known barangay polygon
   */
  resolveBarangay(latitude: number | null | undefined, longitude: number | null | undefined): string | null {
    if (
      latitude == null ||
      longitude == null ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return null;
    }

    if (this.barangayFeatures.length === 0) {
      return null;
    }

    try {
      const pt = turf.point([longitude, latitude]); // GeoJSON uses [lng, lat]

      for (const feature of this.barangayFeatures) {
        if (
          feature.geometry &&
          (feature.geometry.type === 'Polygon' ||
            feature.geometry.type === 'MultiPolygon')
        ) {
          if (turf.booleanPointInPolygon(pt, feature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)) {
            // Return the barangay name from GeoJSON properties
            const name: string | undefined =
              (feature.properties as Record<string, any>)?.['name'] ??
              (feature.properties as Record<string, any>)?.['NAME'] ??
              (feature.properties as Record<string, any>)?.['NAME_3'];
            if (name) return name;
          }
        }
      }
    } catch (err) {
      this.logger.error(`Barangay point-in-polygon check failed: ${(err as Error).message}`);
    }

    return null;
  }
}

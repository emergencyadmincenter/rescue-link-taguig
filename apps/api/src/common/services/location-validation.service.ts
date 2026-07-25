import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';

@Injectable()
export class LocationValidationService implements OnModuleInit {
  private readonly logger = new Logger(LocationValidationService.name);
  private boundaryGeojson: any = null;

  onModuleInit() {
    this.loadBoundaryGeojson();
  }

  private loadBoundaryGeojson() {
    try {
      const candidatePaths = [
        path.join(__dirname, '..', 'data', 'taguig-boundary.geojson'),
        // Fallback for local development when Nest CLI does not copy assets to dist
        path.join(process.cwd(), 'src', 'common', 'data', 'taguig-boundary.geojson'),
      ];

      let geojsonPath: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          geojsonPath = p;
          break;
        }
      }

      if (geojsonPath) {
        const fileContent = fs.readFileSync(geojsonPath, 'utf8');
        this.boundaryGeojson = JSON.parse(fileContent);
        this.logger.log(
          `Successfully loaded Taguig boundary GeoJSON from ${geojsonPath}`,
        );
      } else {
        this.logger.warn(
          'Could not find Taguig boundary GeoJSON. Geofencing validation will be skipped (fail-closed).',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error loading Taguig boundary GeoJSON: ${error.message}`,
      );
    }
  }

  /**
   * Validates if the given coordinates are inside the Taguig City boundary.
   */
  isWithinTaguig(latitude: number, longitude: number): boolean {
    if (!this.boundaryGeojson) {
      this.logger.error('Boundary GeoJSON not loaded. Failing closed.');
      return false; // Fail closed if boundary is not loaded
    }

    if (
      latitude == null ||
      longitude == null ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return true; // Pass through if coordinates are missing/invalid
    }

    try {
      const pt = turf.point([longitude, latitude]);

      let features: any[] = [];
      if (this.boundaryGeojson.type === 'FeatureCollection') {
        features = this.boundaryGeojson.features;
      } else if (this.boundaryGeojson.type === 'Feature') {
        features = [this.boundaryGeojson];
      } else if (
        this.boundaryGeojson.type === 'Polygon' ||
        this.boundaryGeojson.type === 'MultiPolygon'
      ) {
        features = [{ type: 'Feature', geometry: this.boundaryGeojson }];
      }

      for (const feature of features) {
        if (
          feature.geometry &&
          (feature.geometry.type === 'Polygon' ||
            feature.geometry.type === 'MultiPolygon')
        ) {
          if (turf.booleanPointInPolygon(pt, feature.geometry)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error during Point-in-Polygon validation: ${error.message}`,
      );
      return false; // Fail closed on error
    }
  }
}

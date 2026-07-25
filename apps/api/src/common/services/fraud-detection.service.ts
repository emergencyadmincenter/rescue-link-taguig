import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { Request } from 'express';

export interface FraudAssessmentResult {
  ipAddress: string;
  ipLocation?: {
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    city: string;
  };
  isVpn: boolean;
  isProxy: boolean;
  isHosting: boolean;
  distanceKm?: number;
  riskClassification: 'low_risk' | 'high_fraud_risk';
  locationPermissionGranted: boolean;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  extractClientIp(req: Request): string {
    let rawIp = 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = (forwardedFor as string).split(',').map((ip) => ip.trim());
      rawIp = ips[0];
    } else {
      const realIp = req.headers['x-real-ip'];
      if (realIp) {
        rawIp = realIp as string;
      } else {
        rawIp = req.ip || req.socket?.remoteAddress || 'unknown';
      }
    }
    
    // Normalize IPv4-mapped IPv6 addresses (e.g. ::ffff:172.18.0.1 -> 172.18.0.1)
    if (rawIp.startsWith('::ffff:')) {
      return rawIp.replace('::ffff:', '');
    }
    return rawIp;
  }

  async analyzeFraudRisk(
    clientIp: string,
    residentLat?: number,
    residentLng?: number,
  ): Promise<FraudAssessmentResult> {
    const locationPermissionGranted = residentLat !== undefined && residentLng !== undefined;
    
    let ipLocation: FraudAssessmentResult['ipLocation'] = undefined;
    let isVpn = false;
    let isProxy = false;
    let isHosting = false;
    let distanceKm: number | undefined = undefined;
    let riskClassification: 'low_risk' | 'high_fraud_risk' = 'low_risk';

    if (clientIp && clientIp !== 'unknown') {
      try {
        const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp.startsWith('172.');
        const url = isLocal
          ? `http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon,proxy,hosting`
          : `http://ip-api.com/json/${clientIp}?fields=status,message,country,regionName,city,lat,lon,proxy,hosting`;
        this.logger.log(`FraudDetection: Testing IP ${clientIp} (isLocal: ${isLocal}). URL: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          this.logger.log(`FraudDetection: ip-api returned: ${JSON.stringify(data)}`);
          if (data.status === 'success') {
            ipLocation = {
              latitude: data.lat,
              longitude: data.lon,
              country: data.country,
              region: data.regionName,
              city: data.city,
            };
            isProxy = !!data.proxy;
            isHosting = !!data.hosting;
            isVpn = !!data.proxy; // Approximation

            if (locationPermissionGranted && ipLocation && ipLocation.latitude !== undefined && ipLocation.longitude !== undefined) {
              distanceKm = this.calculateHaversineDistance(
                residentLat as number,
                residentLng as number,
                ipLocation.latitude,
                ipLocation.longitude
              );
            }
          }
        }
      } catch (error: any) {
        this.logger.error(`Failed to fetch IP geolocation for ${clientIp}: ${error.message}`);
      }
    }

    if (distanceKm !== undefined && distanceKm > 100) {
      riskClassification = 'high_fraud_risk';
    } else if (isVpn || isProxy || isHosting) {
      riskClassification = 'high_fraud_risk';
    }
    this.logger.log(`FraudDetection: distanceKm: ${distanceKm}, riskClassification: ${riskClassification}`);
    return {
      ipAddress: clientIp,
      ipLocation,
      isVpn,
      isProxy,
      isHosting,
      distanceKm,
      riskClassification,
      locationPermissionGranted,
    };
  }

  async saveFraudAssessment(
    logId: string,
    callId: string,
    assessment: FraudAssessmentResult,
    residentLat?: number,
    residentLng?: number,
  ) {
    try {
      await this.prisma.fraudAssessment.create({
        data: {
          log_id: logId,
          call_id: callId,
          client_ip: assessment.ipAddress,
          ip_latitude: assessment.ipLocation?.latitude,
          ip_longitude: assessment.ipLocation?.longitude,
          ip_country: assessment.ipLocation?.country,
          ip_region: assessment.ipLocation?.region,
          ip_city: assessment.ipLocation?.city,
          resident_latitude: residentLat,
          resident_longitude: residentLng,
          location_permission_granted: assessment.locationPermissionGranted,
          distance_km: assessment.distanceKm,
          is_vpn: assessment.isVpn,
          is_proxy: assessment.isProxy,
          is_hosting: assessment.isHosting,
          risk_classification: assessment.riskClassification,
        }
      });
      this.logger.log(`FraudDetection: Successfully saved fraud assessment for log ${logId}`);
    } catch (error: any) {
      this.logger.error(`Failed to save fraud assessment for log ${logId}: ${error.message}`);
    }
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

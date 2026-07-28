import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

@Injectable()
export class ResidentOrJwtAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if the request has any resident_call_* cookie
    if (request.cookies) {
      const hasResidentCookie = Object.keys(request.cookies).some((key) =>
        key.startsWith('resident_call_') && request.cookies[key] === 'true'
      );
      
      if (hasResidentCookie) {
        // We consider them authorized as a resident
        request['user'] = { role: 'resident' };
        return true;
      }
    }

    // Otherwise, fallback to the standard JWT check
    try {
      return await super.canActivate(context);
    } catch (err) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
  }
}

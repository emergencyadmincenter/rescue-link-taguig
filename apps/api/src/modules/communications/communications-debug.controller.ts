import { Controller, Get } from '@nestjs/common';
import { CommunicationsService } from './communications.service';

@Controller('communications-debug')
export class CommunicationsDebugController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Get('state')
  getState() {
    return this.communicationsService.getDebugState();
  }
}

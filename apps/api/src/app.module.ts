import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonnelModule } from './modules/personnel/personnel.module';

@Module({
  imports: [PersonnelModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

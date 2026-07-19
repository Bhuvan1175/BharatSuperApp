import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { RoleModule } from './role/role.module';
import { DepartmentModule } from './department/department.module';
import { AdminModule } from './admin/admin.module';
import { LocationModule } from './location/location.module';
import { ListingModule } from './listing/listing.module';
import { MedicineModule } from './modules/medicine/medicine.module';
import { WaterModule } from './modules/water/water.module';
import { AreaIntelligenceModule } from './modules/area-intelligence/area-intelligence.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global default rate limit (generous — 100 req / 60s per IP). Individual
    // routes (e.g. Area Intelligence admin sync/refresh/recalculate) can
    // override with a stricter @Throttle(...).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // Cron triggers for background jobs (Area Intelligence schedulers).
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    RedisModule,
    EmailModule,
    RoleModule,
    DepartmentModule,
    AdminModule,
    // Shared location data + generic module entries (Water, etc.).
    LocationModule,
    ListingModule,
    // Example module APIs demonstrating role-gated authorization.
    MedicineModule,
    WaterModule,
    AreaIntelligenceModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

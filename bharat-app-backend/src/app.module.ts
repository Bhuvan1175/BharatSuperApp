import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

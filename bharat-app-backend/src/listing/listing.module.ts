import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

/**
 * ListingModule — one generic entries API serving every department module.
 * PrismaService comes from the global PrismaModule.
 */
@Module({
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}

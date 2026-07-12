import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  CreateListingDto,
  QueryListingsDto,
  UpdateListingDto,
} from './dto/listing.dto';

/**
 * Generic module entries (Water updates, alerts, listings, …).
 * Authenticated for all routes; write access is checked per-entry against the
 * caller's "<moduleKey>:manage" permission inside the service.
 */
@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryListingsDto) {
    return this.listingService.list(user, query);
  }

  /** Manager dashboard counts. Declared before ':id' so it isn't shadowed. */
  @Get('stats')
  stats(
    @CurrentUser() user: AuthUser,
    @Query('moduleKey') moduleKey: string,
  ) {
    return this.listingService.stats(user, moduleKey);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listingService.getOne(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.listingService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listingService.remove(user, id);
  }
}

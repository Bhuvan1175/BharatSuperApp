import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import {
  CreateCityDto,
  CreateDistrictDto,
  CreateStateDto,
} from './dto/city.dto';
import { BulkNamesDto, CreateLocalityDto } from './dto/locality.dto';
import { CreateWardDto } from './dto/ward.dto';

/**
 * Location hierarchy — State → District → City → (Locality | Ward).
 * All routes require a logged-in user (JwtAuthGuard). Reads are open; writes are
 * enforced manager-only inside the service.
 */
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /** Whether auto-fill is enabled on the backend, and the active provider. */
  @Get('ai-status')
  aiStatus() {
    return this.locationService.aiStatus();
  }

  /* ------------------------------ States ------------------------------- */
  @Get('states')
  listStates() {
    return this.locationService.listStates();
  }

  @Post('states')
  createState(@CurrentUser() user: AuthUser, @Body() dto: CreateStateDto) {
    return this.locationService.createState(user, dto);
  }

  @Delete('states/:id')
  deleteState(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.deleteState(user, id);
  }

  /* ----------------------------- Districts ----------------------------- */
  @Get('states/:id/districts')
  listDistricts(@Param('id') id: string) {
    return this.locationService.listDistricts(id);
  }

  @Post('states/:id/districts')
  createDistrict(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateDistrictDto,
  ) {
    return this.locationService.createDistrict(user, id, dto);
  }

  @Post('states/:id/districts/bulk')
  bulkDistricts(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: BulkNamesDto,
  ) {
    return this.locationService.bulkDistricts(user, id, dto);
  }

  @Post('states/:id/suggest-districts')
  suggestDistricts(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.suggestDistricts(user, id);
  }

  @Delete('districts/:id')
  deleteDistrict(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.deleteDistrict(user, id);
  }

  /* ------------------------------ Cities ------------------------------- */
  @Get('districts/:id/cities')
  listCities(@Param('id') id: string) {
    return this.locationService.listCities(id);
  }

  @Post('districts/:id/cities')
  createCity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateCityDto,
  ) {
    return this.locationService.createCity(user, id, dto);
  }

  @Post('districts/:id/cities/bulk')
  bulkCities(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: BulkNamesDto,
  ) {
    return this.locationService.bulkCities(user, id, dto);
  }

  @Post('districts/:id/suggest-cities')
  suggestCities(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.suggestCities(user, id);
  }

  /** Re-run the AI/govt village auto-fetch for an existing district. */
  @Post('districts/:id/refetch-cities')
  refetchCities(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.refetchCities(user, id);
  }

  @Delete('cities/:id')
  deleteCity(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.deleteCity(user, id);
  }

  /* ------------------------------- Wards ------------------------------- */
  /** Lazily auto-fetches wards on first access, then returns them. */
  @Get('cities/:id/wards')
  listWards(@Param('id') id: string) {
    return this.locationService.listWards(id);
  }

  @Post('cities/:id/wards')
  createWard(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateWardDto,
  ) {
    return this.locationService.createWard(user, id, dto);
  }

  /** Force a fresh ward auto-fetch for a city. */
  @Post('cities/:id/wards/refetch')
  refetchWards(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.refetchWards(user, id);
  }

  @Delete('wards/:id')
  deleteWard(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.deleteWard(user, id);
  }

  /* ---------------------------- Localities ----------------------------- */
  @Get('cities/:id/localities')
  listLocalities(@Param('id') id: string) {
    return this.locationService.listLocalities(id);
  }

  @Post('cities/:id/localities')
  createLocality(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateLocalityDto,
  ) {
    return this.locationService.createLocality(user, id, dto);
  }

  @Post('cities/:id/localities/bulk')
  bulkLocalities(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: BulkNamesDto,
  ) {
    return this.locationService.bulkLocalities(user, id, dto);
  }

  @Post('cities/:id/suggest-localities')
  suggestLocalities(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.suggestLocalities(user, id);
  }

  @Delete('localities/:id')
  deleteLocality(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.locationService.deleteLocality(user, id);
  }
}

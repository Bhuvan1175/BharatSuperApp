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
import { MedicineService } from './medicine.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
import {
  CreateMedicineDto,
  CreateMedicineRequestDto,
  GeocodeQueryDto,
  PincodeLookupDto,
  QueryMedicineRequestsDto,
  QueryMedicinesDto,
  UpdateMedicineDto,
  UpdateRequestStatusDto,
  UpdateStockDto,
  UpdateStoreDto,
} from './dto/medicine.dto';

/**
 * Medicine Store Dashboard API.
 *
 * VIEW  (GET medicines)        → any authenticated user; citizens only ever
 *                                 see active, in-stock medicines (enforced in
 *                                 the service), so the store is the single
 *                                 source of truth for what's requestable.
 * MANAGE (create/update/stock/
 *         stats/requests)      → MEDICINE_MANAGER only (SUPER_ADMIN bypasses
 *                                 RolesGuard automatically).
 * REQUESTS (create/mine)       → any authenticated citizen.
 */
@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryMedicinesDto) {
    return this.medicineService.list(user, query);
  }

  /** Manager dashboard counts. Declared before ':id' so it isn't shadowed. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Get('stats')
  stats() {
    return this.medicineService.stats();
  }

  /** Manager: every citizen request, optionally filtered by status/medicine. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Get('requests')
  listRequests(@Query() query: QueryMedicineRequestsDto) {
    return this.medicineService.listRequests(query);
  }

  /** Citizen: their own request history. */
  @UseGuards(JwtAuthGuard)
  @Get('requests/mine')
  myRequests(@CurrentUser() user: AuthUser) {
    return this.medicineService.myRequests(user);
  }

  /**
   * Store pickup location/contact. Any authenticated user can view it
   * (citizens need this to know where to collect a medicine); declared
   * before ':id' so it isn't shadowed.
   */
  @UseGuards(JwtAuthGuard)
  @Get('store')
  getStore() {
    return this.medicineService.getStore();
  }

  /** Manager: edit the store's pickup location/contact details. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Patch('store')
  updateStore(@Body() dto: UpdateStoreDto) {
    return this.medicineService.updateStore(dto);
  }

  /**
   * Address autocomplete for the pickup location: manager types a 6-digit
   * PIN, gets back matching localities (each with lat/long where data.gov.in
   * has it). Declared before ':id' so it isn't shadowed.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Get('store/pincode-lookup')
  pincodeLookup(@Query() query: PincodeLookupDto) {
    return this.medicineService.pincodeLookup(query.pincode);
  }

  /** Fallback geocode for a free-typed address (when a picked locality has no coordinates). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Get('store/geocode')
  geocode(@Query() query: GeocodeQueryDto) {
    return this.medicineService.geocode(query.address);
  }

  /** Citizen: place a new request for a medicine. */
  @UseGuards(JwtAuthGuard)
  @Post('requests')
  createRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMedicineRequestDto,
  ) {
    return this.medicineService.createRequest(user, dto);
  }

  /** Manager: accept / reject / mark ready / complete a request. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Patch('requests/:id/status')
  updateRequestStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.medicineService.updateRequestStatus(user, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.medicineService.getOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMedicineDto) {
    return this.medicineService.create(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMedicineDto) {
    return this.medicineService.update(id, dto);
  }

  /** Update the absolute stock quantity (e.g. after a restock count). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Patch(':id/stock')
  updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.medicineService.updateStock(id, dto);
  }

  /** Soft-remove (hides from catalogue; keeps request history intact). */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICINE_MANAGER')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.medicineService.remove(id);
  }
}

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Mirrors the Prisma `RequestStatus` enum (kept in sync manually). */
export enum RequestStatusDto {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COMPLETED = 'COMPLETED',
}

/** Derived (not stored) stock status, computed from stockQty vs threshold. */
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Dosage strength label, e.g. "250mg", "500mg", "5ml". */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  manufacturer?: string;

  /** Batch/lot number for the current stock. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  /** Real generic-alternative name, e.g. "Paracetamol 650 (generic)". */
  @IsOptional()
  @IsString()
  @MaxLength(140)
  genericName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  genericPrice?: number;

  /** Short dosage/safety guidance shown with the generic alternative. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  dosageNote?: string;
}

export class UpdateMedicineDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  genericName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  genericPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  dosageNote?: string;
}

/** Body for PATCH /medicines/:id/stock — sets the absolute stock quantity. */
export class UpdateStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty!: number;
}

/** Query filters for GET /medicines. */
export class QueryMedicinesDto {
  @IsOptional()
  @IsString()
  search?: string;

  /** Manager-only: include inactive (removed) medicines. */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreateMedicineRequestDto {
  @IsString()
  @IsNotEmpty()
  medicineId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Query filters for GET /medicines/requests (manager). */
export class QueryMedicineRequestsDto {
  @IsOptional()
  @IsEnum(RequestStatusDto)
  status?: RequestStatusDto;

  @IsOptional()
  @IsString()
  medicineId?: string;
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatusDto)
  status!: RequestStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Body for PATCH /medicines/store — the store's pickup location/contact. */
export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  openingHours?: string;
}

/** Query for GET /medicines/store/pincode-lookup — address autocomplete. */
export class PincodeLookupDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be exactly 6 digits' })
  pincode!: string;
}

/** Query for GET /medicines/store/geocode — free-text address geocoding. */
export class GeocodeQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;
}

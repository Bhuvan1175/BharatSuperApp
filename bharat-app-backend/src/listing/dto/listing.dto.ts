import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Allowed status values, kept as a plain string for flexibility. */
export const LISTING_STATUSES = [
  'active',
  'scheduled',
  'archived',
  'expired',
] as const;

export class CreateListingDto {
  /** Which module this entry belongs to, e.g. "water". Required. */
  @IsString()
  @IsNotEmpty()
  moduleKey!: string;

  /** Kind of entry: "update", "alert", "listing", … Defaults to "update". */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  localityId?: string;

  /** Module-specific extras (e.g. { timing: "8:00 AM" }). */
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

/** Query filters for GET /listings. All optional. */
export class QueryListingsDto {
  @IsOptional()
  @IsString()
  moduleKey?: string;

  @IsOptional()
  @IsString()
  localityId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

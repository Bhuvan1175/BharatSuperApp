import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AmenityCategory } from '@prisma/client';

/** GET /areas — cursor-paginated list, filterable by city. */
export class ListAreasDto {
  @IsOptional()
  @IsString()
  cityId?: string;

  /** Last area id seen on the previous page (cuid). Omit for the first page. */
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** GET /areas/search — text (name/pincode) or geo (lat/long + radius) search. */
export class SearchAreasDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(50000)
  radiusMeters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** GET /areas/:id/history — date-ranged trend series. */
export class AreaHistoryQueryDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

/** GET /areas/:id/nearby — optional category filter. */
export class NearbyQueryDto {
  @IsOptional()
  @IsEnum(AmenityCategory)
  category?: AmenityCategory;
}

import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Create a locality / area under a city, e.g. "Ward 3" or "Gandhi Nagar".
 * The PIN code is optional but strongly recommended: when present, the
 * backend best-effort resolves it to real lat/long via the government
 * pincode directory (data.gov.in), which is what nearby-amenity collection
 * needs to run for this area later.
 */
export class CreateLocalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be exactly 6 digits' })
  pincode?: string;
}

/** Save many child names at once under a parent (used after an AI seed). */
export class BulkNamesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  names!: string[];
}

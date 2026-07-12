import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Create a locality / area under a city, e.g. "Ward 3" or "Gandhi Nagar". */
export class CreateLocalityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;
}

/** Save many child names at once under a parent (used after an AI seed). */
export class BulkNamesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  names!: string[];
}

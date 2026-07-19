import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Admin: register an AreaMaster row for a Locality that doesn't have one yet. */
export class CreateAreaMasterDto {
  @IsString()
  @IsNotEmpty()
  localityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  administrativeCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  population?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  populationYear?: number;
}

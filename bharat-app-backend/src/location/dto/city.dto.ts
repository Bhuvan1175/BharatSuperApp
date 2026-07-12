import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Create a state, e.g. "Maharashtra". */
export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

/** Create a district under a state, e.g. "Nagpur". */
export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

/** Create a city / town under a district, e.g. "Kalmeshwar". */
export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

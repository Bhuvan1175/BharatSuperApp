import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Create a ward under a city/village, e.g. { number: "3", name: "Gandhi Nagar" }. */
export class CreateWardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  number!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}

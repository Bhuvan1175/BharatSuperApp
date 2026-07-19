import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

/** POST /areas/compare — stateless side-by-side comparison, capped at 4 areas
 * to bound query cost. */
export class CompareAreasDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  areaIds!: string[];
}

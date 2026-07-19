import { IsNotEmpty, IsString } from 'class-validator';

/** POST /areas/save — body { areaId } → upsert SavedArea. */
export class SaveAreaDto {
  @IsString()
  @IsNotEmpty()
  areaId!: string;
}

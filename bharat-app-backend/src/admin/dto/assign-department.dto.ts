import { IsString } from 'class-validator';

export class AssignDepartmentDto {
  /** Department name to assign, e.g. MEDICINE. */
  @IsString()
  department!: string;
}

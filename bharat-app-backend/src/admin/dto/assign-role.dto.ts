import { IsString } from 'class-validator';

export class AssignRoleDto {
  /** Role name to assign, e.g. MEDICINE_MANAGER. */
  @IsString()
  role!: string;
}

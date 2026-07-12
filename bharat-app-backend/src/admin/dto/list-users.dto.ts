import { IsOptional, IsString } from 'class-validator';

/** Query filters for GET /admin/users. All optional. */
export class ListUsersQueryDto {
  /** Filter by department name, e.g. MEDICINE. */
  @IsOptional()
  @IsString()
  department?: string;

  /** Filter by role name, e.g. MEDICINE_MANAGER. */
  @IsOptional()
  @IsString()
  role?: string;

  /** Free-text search over name / email / username. */
  @IsOptional()
  @IsString()
  search?: string;
}

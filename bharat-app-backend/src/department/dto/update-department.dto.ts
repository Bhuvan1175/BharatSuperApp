import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Admin edit of a department. Only the human-facing `label` is editable.
 *
 * `name` (UPPER_SNAKE_CASE) and `moduleKey` are intentionally NOT here — they
 * wire the department to roles, permissions and the frontend app module, so
 * changing them would break existing routing/RBAC. They stay immutable.
 */
export class UpdateDepartmentDto {
  /** Display label shown in the UI, e.g. "Medicine". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}

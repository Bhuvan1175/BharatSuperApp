import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateDepartmentDto {
  /** UPPER_SNAKE_CASE department name, e.g. TRANSPORT. */
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'name must be UPPER_SNAKE_CASE (e.g. TRANSPORT)',
  })
  name!: string;

  @IsOptional()
  @IsString()
  label?: string;

  /** lower_snake_case module key, matching the frontend module (e.g. transport). */
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'moduleKey must be lower_snake_case (e.g. transport)',
  })
  moduleKey!: string;

  /**
   * OPTIONAL: link an EXISTING role as the department's default (manager) role.
   * If omitted, a new "<NAME>_MANAGER" role is auto-created with
   * ["<moduleKey>:view", "<moduleKey>:manage"] and linked.
   */
  @IsOptional()
  @IsString()
  roleId?: string;
}

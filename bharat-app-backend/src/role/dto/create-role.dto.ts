import { IsArray, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRoleDto {
  /** UPPER_SNAKE_CASE role name, e.g. TRANSPORT_MANAGER. */
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'name must be UPPER_SNAKE_CASE (e.g. TRANSPORT_MANAGER)',
  })
  name!: string;

  @IsOptional()
  @IsString()
  label?: string;

  /** Permission strings like "transport:view", "transport:manage". */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

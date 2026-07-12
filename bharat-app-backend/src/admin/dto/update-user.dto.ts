import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/**
 * Admin edit of a user. Every field optional — send only what changes.
 * `email` is NOT here (immutable identity). Changing `department` auto-sets the
 * user's role to that department's default role unless `role` is also provided.
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Enter a valid 10-digit Indian mobile number',
  })
  phoneNumber?: string;

  /** Department name to move the user to (role follows the department). */
  @IsOptional()
  @IsString()
  department?: string;

  /** Explicit role override (wins over the department's default role). */
  @IsOptional()
  @IsString()
  role?: string;

  /** Activate / deactivate the account. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

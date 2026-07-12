import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class CreateDepartmentUserDto {
  /** The officer's email — they log in with the SAME Email OTP flow. */
  @IsEmail()
  email!: string;

  /** Department name, e.g. MEDICINE. Required. */
  @IsString()
  department!: string;

  /**
   * Role name, e.g. MEDICINE_MANAGER. OPTIONAL — if omitted, the department's
   * default (manager) role is used.
   */
  @IsOptional()
  @IsString()
  role?: string;

  /** Optional display name. */
  @IsOptional()
  @IsString()
  name?: string;

  /** Optional 10-digit mobile number. */
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Enter a valid 10-digit Indian mobile number',
  })
  phoneNumber?: string;
}

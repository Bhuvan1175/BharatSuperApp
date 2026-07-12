import { IsEmail, IsString } from 'class-validator';

export class CreateDepartmentUserDto {
  /** The officer's email — they log in with the SAME Email OTP flow. */
  @IsEmail()
  email!: string;

  /** Role name, e.g. MEDICINE_MANAGER. */
  @IsString()
  role!: string;

  /** Department name, e.g. MEDICINE. */
  @IsString()
  department!: string;
}

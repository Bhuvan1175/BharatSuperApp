import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  // NOTE: `email` is intentionally NOT updatable here.
  // It is set once during OTP signup (verifyOtp) and must not be changed
  // via the profile update endpoint. Because main.ts uses
  // ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  // any request that includes `email` is rejected with a 400.

  @IsOptional()
  @IsString()
  @Length(3, 30, {
    message: 'Username must be between 3 and 30 characters long',
  })
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'Username may only contain lowercase letters, numbers, underscore (_) and dot (.)',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150, {
    message: 'Bio must not exceed 150 characters',
  })
  bio?: string;

  // Mobile number — editable. Stored as the 10-digit number (the app shows the
  // +91 prefix). It is @unique in the schema, so a duplicate returns 409.
  @IsOptional()
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Enter a valid 10-digit Indian mobile number',
  })
  phoneNumber?: string;
}

import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
}
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsNotEmpty({ message: 'Search query must not be empty' })
  @MaxLength(50, {
    message: 'Search query must not exceed 50 characters',
  })
  query!: string;
}
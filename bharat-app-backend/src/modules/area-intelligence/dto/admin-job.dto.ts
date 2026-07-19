import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BackgroundJobType, JobStatus } from '@prisma/client';

/** Body for POST /admin/areas/refresh|recalculate — single area, or every
 * area when omitted. */
export class AdminAreaTargetDto {
  @IsOptional()
  @IsString()
  areaId?: string;
}

/** Query for GET /admin/jobs. */
export class QueryJobsDto {
  @IsOptional()
  @IsEnum(BackgroundJobType)
  jobType?: BackgroundJobType;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/** Body for PATCH /admin/data-sources/:id — toggle without a redeploy. */
export class UpdateDataSourceDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number;
}

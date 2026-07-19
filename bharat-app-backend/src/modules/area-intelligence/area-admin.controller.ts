import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaAdminService } from './area-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
import {
  AdminAreaTargetDto,
  QueryJobsDto,
  UpdateDataSourceDto,
} from './dto/admin-job.dto';

/**
 * Admin surface — AREA_MANAGER (or SUPER_ADMIN, which bypasses RolesGuard
 * automatically), matching the seeded AREA_MANAGER role/AREA department
 * (prisma/seed.ts) and every other module's manager-gated admin routes
 * (docs §10 — same RBAC mechanism as Medicine/Water, no new auth added).
 */
@Controller({ path: 'admin/areas', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('AREA_MANAGER')
export class AreaAdminController {
  constructor(private readonly adminService: AreaAdminService) {}

  @Post('sync')
  @HttpCode(202)
  sync(@CurrentUser() user: AuthUser) {
    return this.adminService.syncAreaMaster(user);
  }

  @Post('refresh')
  @HttpCode(202)
  refresh(@CurrentUser() user: AuthUser, @Body() dto: AdminAreaTargetDto) {
    return this.adminService.refresh(user, dto.areaId);
  }

  @Post('recalculate')
  @HttpCode(202)
  recalculate(@CurrentUser() user: AuthUser, @Body() dto: AdminAreaTargetDto) {
    return this.adminService.recalculate(user, dto.areaId);
  }

  @Get('jobs')
  listJobs(@Query() query: QueryJobsDto) {
    return this.adminService.listJobs(query);
  }

  @Get('data-sources')
  listDataSources() {
    return this.adminService.listDataSources();
  }

  @Patch('data-sources/:id')
  updateDataSource(@Param('id') id: string, @Body() dto: UpdateDataSourceDto) {
    return this.adminService.updateDataSource(id, dto);
  }

  /** Prometheus text-format job outcome counters (docs §12). */
  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  metrics() {
    return this.adminService.metricsText();
  }
}

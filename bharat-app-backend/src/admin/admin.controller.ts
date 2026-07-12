import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateDepartmentUserDto } from './dto/create-department-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Super-admin operations. All routes require SUPER_ADMIN and reuse the existing
 * JwtAuthGuard — no separate auth.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** List users (optionally filtered by department / role / search). */
  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  /** Dashboard counts (users, managers, departments, roles). */
  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  /** Create (or promote) a department officer. */
  @Post('department-users')
  createDepartmentUser(@Body() dto: CreateDepartmentUserDto) {
    return this.adminService.createDepartmentUser(dto);
  }

  /** Edit a user (name, phone, department, role, active state). */
  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(user.userId, id, dto);
  }

  /** Deactivate a department user. */
  @Patch('users/:id/deactivate')
  deactivate(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.adminService.deactivateUser(user.userId, id);
  }

  /** Re-activate a department user. */
  @Patch('users/:id/activate')
  activate(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.adminService.activateUser(user.userId, id);
  }
}

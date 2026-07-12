import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { CreateDepartmentUserDto } from './dto/create-department-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Super-admin operations. All routes require SUPER_ADMIN and reuse the existing
 * JwtAuthGuard — no separate auth.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Create (or promote) a department officer. */
  @Post('department-users')
  createDepartmentUser(@Body() dto: CreateDepartmentUserDto) {
    return this.adminService.createDepartmentUser(dto);
  }

  /** Assign a role to a user. */
  @Patch('users/:id/role')
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.adminService.assignRole(id, dto.role);
  }

  /** Assign a department to a user. */
  @Patch('users/:id/department')
  assignDepartment(
    @Param('id') id: string,
    @Body() dto: AssignDepartmentDto,
  ) {
    return this.adminService.assignDepartment(id, dto.department);
  }

  /** Deactivate a department user. */
  @Patch('users/:id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  /** Re-activate a department user. */
  @Patch('users/:id/activate')
  activate(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }
}

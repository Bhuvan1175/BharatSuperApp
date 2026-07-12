import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

/**
 * RoleModule — Super-admin role management. PrismaService is available via the
 * global PrismaModule, so nothing else needs importing.
 */
@Module({
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}

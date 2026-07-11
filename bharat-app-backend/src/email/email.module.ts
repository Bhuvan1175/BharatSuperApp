import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * EmailModule
 *
 * Marked @Global so EmailService can be injected anywhere (e.g. AuthService)
 * without re-importing this module everywhere — consistent with how
 * RedisModule and PrismaModule are exposed in this project.
 */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

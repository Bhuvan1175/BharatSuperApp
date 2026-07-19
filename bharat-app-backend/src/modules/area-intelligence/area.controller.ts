import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaService } from './area.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/strategies/jwt.strategy';
import {
  ListAreasDto,
  SearchAreasDto,
  AreaHistoryQueryDto,
  NearbyQueryDto,
} from './dto/area-query.dto';
import { CompareAreasDto } from './dto/compare-areas.dto';
import { SaveAreaDto } from './dto/save-area.dto';

/**
 * Public Area Query API (docs §4). Read-only for every authenticated user —
 * the write path (score/insight computation) belongs entirely to background
 * jobs + the Admin API, never to this controller.
 */
@Controller({ path: 'areas', version: '1' })
@UseGuards(JwtAuthGuard)
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Get()
  list(@Query() query: ListAreasDto) {
    return this.areaService.list(query);
  }

  /** Declared before ':id' so it isn't shadowed. */
  @Get('search')
  search(@Query() query: SearchAreasDto) {
    return this.areaService.search(query);
  }

  @Get('saved/mine')
  mySavedAreas(@CurrentUser() user: AuthUser) {
    return this.areaService.mySavedAreas(user);
  }

  @Post('save')
  save(@CurrentUser() user: AuthUser, @Body() dto: SaveAreaDto) {
    return this.areaService.saveArea(user, dto.areaId);
  }

  @Delete('save/:id')
  unsave(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.areaService.unsaveArea(user, id);
  }

  @Post('compare')
  compare(@Body() dto: CompareAreasDto) {
    return this.areaService.compare(dto);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.areaService.getDetail(id);
  }

  @Get(':id/intelligence')
  getIntelligence(@Param('id') id: string) {
    return this.areaService.getIntelligence(id);
  }

  @Get(':id/nearby')
  getNearby(@Param('id') id: string, @Query() query: NearbyQueryDto) {
    return this.areaService.getNearby(id, query.category);
  }

  @Get(':id/property-stats')
  getPropertyStats(@Param('id') id: string) {
    return this.areaService.getPropertyStats(id);
  }

  @Get(':id/history')
  getHistory(@Param('id') id: string, @Query() query: AreaHistoryQueryDto) {
    return this.areaService.getHistory(id, query);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.areaService.getSummary(id);
  }
}

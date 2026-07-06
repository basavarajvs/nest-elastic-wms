import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface PickTask {
  task_id: bigint;
  from_location_id?: bigint | null;
  [key: string]: any;
}

interface LocationCoord {
  taskId: number;
  locationId: number;
  aisle: number;
  bay: number;
  level: number;
}

@Injectable()
export class PickRouteService {
  private readonly logger = new Logger(PickRouteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async optimizePickRoute(tenantId: string, tasks: PickTask[]): Promise<PickTask[]> {
    if (!tasks.length) return tasks;

    let coords: LocationCoord[];
    try {
      coords = await this.fetchCoordinates(tenantId, tasks);
    } catch (err) {
      this.logger.warn(`Failed to fetch location coordinates: ${(err as Error).message}`);
      return this.fallbackOrder(tasks);
    }

    if (!coords.length) return this.fallbackOrder(tasks);

    const hasCoords = coords.every(c => c.aisle >= 0 && c.bay >= 0 && c.level >= 0);
    if (!hasCoords) return this.fallbackOrder(tasks);

    const ordered = this.nearestNeighbor(coords);

    const taskMap = new Map(tasks.map(t => [Number(t.task_id), t]));
    return ordered.map((coord, i) => ({
      ...taskMap.get(coord.taskId)!,
      route_sequence: i + 1,
    }));
  }

  async saveRoute(
    tenantId: string,
    waveId: bigint,
    pickerId: string,
    orderedTasks: PickTask[],
  ): Promise<number> {
    if (!orderedTasks.length) return 0;

    let coords: LocationCoord[] = [];
    try {
      coords = await this.fetchCoordinates(tenantId, orderedTasks);
    } catch (_) {}

    const coordMap = new Map<number, LocationCoord>();
    for (const c of coords) coordMap.set(c.taskId, c);

    const records = orderedTasks.map((task, i) => {
      const prev = i > 0 ? orderedTasks[i - 1] : null;
      let dist: number | null = null;
      if (prev && task.from_location_id && prev.from_location_id) {
        const a = coordMap.get(Number(task.task_id));
        const b = coordMap.get(Number(prev.task_id));
        if (a && b && a.aisle >= 0 && b.aisle >= 0) {
          dist = this.manhattanDistance(a, b);
        }
      }
      return {
        tenant_id: tenantId,
        wave_id: waveId,
        picker_id: pickerId || null,
        sequence_order: i + 1,
        task_id: task.task_id,
        location_id: task.from_location_id ?? 0n,
        estimated_travel_distance: dist,
      };
    });

    await this.prisma.pick_routes.createMany({ data: records });
    return records.length;
  }

  private async fetchCoordinates(tenantId: string, tasks: PickTask[]): Promise<LocationCoord[]> {
    const locationIds = tasks
      .map(t => t.from_location_id)
      .filter((id): id is bigint => id != null);

    if (!locationIds.length) return [];

    const locations = await this.prisma.storage_locations.findMany({
      where: { tenant_id: tenantId, location_id: { in: locationIds } },
      include: {
        aisles: true,
        bays: true,
        rack_levels: true,
      },
    });

    const locMap = new Map(locations.map(l => [Number(l.location_id), l]));

    return tasks.map(task => {
      const loc = task.from_location_id ? locMap.get(Number(task.from_location_id)) : null;
      return {
        taskId: Number(task.task_id),
        locationId: task.from_location_id ? Number(task.from_location_id) : 0,
        aisle: loc?.aisles?.aisle_number ?? -1,
        bay: loc?.bay_number ?? (loc?.bays?.bay_number ?? -1),
        level: loc?.rack_levels?.level_number ?? -1,
      };
    });
  }

  private nearestNeighbor(coords: LocationCoord[]): LocationCoord[] {
    if (coords.length <= 1) return coords;

    const unvisited = [...coords];
    const result: LocationCoord[] = [];

    let current = unvisited.shift()!;
    result.push(current);

    while (unvisited.length) {
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = this.manhattanDistance(current, unvisited[i]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0];
      result.push(current);
    }

    return result;
  }

  private manhattanDistance(a: LocationCoord, b: LocationCoord): number {
    return Math.abs(a.aisle - b.aisle) + Math.abs(a.bay - b.bay) + Math.abs(a.level - b.level);
  }

  private fallbackOrder(tasks: PickTask[]): PickTask[] {
    return tasks.map((t, i) => ({ ...t, route_sequence: i + 1 }));
  }
}

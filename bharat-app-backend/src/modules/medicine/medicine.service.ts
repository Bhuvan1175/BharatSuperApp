import { Injectable } from '@nestjs/common';

/**
 * Placeholder Medicine service. Domain data/tables are out of scope for the
 * RBAC work — this exists to demonstrate the authorization pattern. Swap the
 * in-memory store for Prisma models when the Medicine feature is built.
 */
@Injectable()
export class MedicineService {
  private items: { id: number; name: string }[] = [];

  list() {
    return { module: 'medicine', items: this.items };
  }

  create(name: string) {
    const item = { id: this.items.length + 1, name };
    this.items.push(item);
    return { message: 'Medicine created (placeholder)', item };
  }
}

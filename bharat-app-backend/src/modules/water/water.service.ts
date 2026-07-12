import { Injectable } from '@nestjs/common';

/** Placeholder Water service — see MedicineService for the pattern. */
@Injectable()
export class WaterService {
  private items: { id: number; name: string }[] = [];

  list() {
    return { module: 'water', items: this.items };
  }

  create(name: string) {
    const item = { id: this.items.length + 1, name };
    this.items.push(item);
    return { message: 'Water entry created (placeholder)', item };
  }
}

export interface UtilityRow {
  id: string;
  area: string;
  kind: 'power' | 'water';
  status: 'scheduled' | 'reported';
  window: string;
  note: string;
}

export const UTILITY_ROWS: UtilityRow[] = [
  {id: 'u1', area: 'Baner', kind: 'power', status: 'scheduled', window: 'Today 2:00–4:30 PM', note: 'MSEDCL feeder maintenance.'},
  {id: 'u2', area: 'Pashan', kind: 'water', status: 'reported', window: 'Today 10:00 AM–1:00 PM', note: 'Pipeline repair; low pressure.'},
  {id: 'u3', area: 'Aundh', kind: 'power', status: 'reported', window: 'Restored 11:20 AM', note: 'Unplanned outage — now restored.'},
  {id: 'u4', area: 'Sus', kind: 'water', status: 'scheduled', window: 'Tomorrow 9:00–11:00 AM', note: 'Tank cleaning.'},
];

import {LocalAlert} from '../types';

export const LOCAL_ALERTS: LocalAlert[] = [
  {id: 'a1', type: 'power', title: 'Scheduled power cut', message: 'MSEDCL maintenance in Baner. Charge your devices in advance.', area: 'Baner, Pune', window: {from: '2:00 PM', to: '4:30 PM'}, severity: 'medium'},
  {id: 'a2', type: 'water', title: 'Water supply interruption', message: 'Low pressure due to pipeline work near Pashan Road.', area: 'Baner, Pune', window: {from: '10:00 AM', to: '1:00 PM'}, severity: 'low'},
  {id: 'a3', type: 'traffic', title: 'Heavy traffic', message: 'Congestion on Baner Road toward Highway. Consider Sus Road.', area: 'Baner, Pune', window: {from: '6:00 PM', to: '8:00 PM'}, severity: 'high'},
];

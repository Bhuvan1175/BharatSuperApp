/**
 * Area Intelligence surface — the AREA_MANAGER dashboard + manage screens,
 * plus the real-data Compare screen. The citizen search/detail experience
 * lives in the existing Explore tab (`screens/explore`), not here — see
 * `AreaDetail.tsx` for the real backend wiring.
 */
export {default as AreaDashboardScreen} from './AreaDashboardScreen';
export {default as AreaCompareScreen} from './AreaCompareScreen';
export {default as AreaAdminJobsScreen} from './AreaAdminJobsScreen';
export {default as AreaDataSourcesScreen} from './AreaDataSourcesScreen';

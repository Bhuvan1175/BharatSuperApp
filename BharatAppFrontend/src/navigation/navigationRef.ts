import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList, MainTabParamList} from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const TAB_ROUTES = ['HomeTab', 'ExploreTab', 'TravelTab', 'GovernmentTab', 'ProfileTab'];

/**
 * Central deep-link resolver. AI answers and Home quick actions emit a target
 * name; this routes to either a tab or a pushed stack screen with context.
 */
export function navigateTo(target?: string, params?: object): void {
  if (!target || !navigationRef.isReady()) return;
  if (TAB_ROUTES.includes(target)) {
    navigationRef.navigate('Main', {screen: target as keyof MainTabParamList, params} as never);
  } else {
    navigationRef.navigate(target as never, params as never);
  }
}

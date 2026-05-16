import { createNavigationContainerRef, type NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const rootNavigationRef: NavigationContainerRefWithCurrent<RootStackParamList> =
  createNavigationContainerRef<RootStackParamList>();

/** Opening the stack `Player` screen (modal). Safe when ref not mounted (e.g. Jest). */
export function requestOpenFullPlayer(): void {
  if (!rootNavigationRef.isReady()) return;
  rootNavigationRef.navigate('Player');
}

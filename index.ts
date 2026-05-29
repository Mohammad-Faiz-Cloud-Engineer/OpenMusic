import { registerRootComponent } from 'expo';
import { initMonitoring } from './src/services/monitoring';
import './src/i18n';

initMonitoring();

import App from './App';

registerRootComponent(App);

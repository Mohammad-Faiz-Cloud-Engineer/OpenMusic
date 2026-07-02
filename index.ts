import { registerRootComponent } from 'expo';
import App from './App';
import { initMonitoring } from './src/services/monitoring';
import './src/i18n';

initMonitoring();

registerRootComponent(App);

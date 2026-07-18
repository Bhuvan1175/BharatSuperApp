/**
 * @format
 * Entry point for the Bharat Super App.
 */
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {SNOOZE_ACTION_ID, snoozeReminder} from './src/services/notifications';

// Background event handler for medicine reminders — MUST be registered here
// (outside the React tree) so the "Snooze" action on the notification still
// works when the app is backgrounded or fully killed. Notifee calls this even
// with no JS/React instance mounted.
notifee.onBackgroundEvent(async ({type, detail}) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === SNOOZE_ACTION_ID) {
    const id = detail.notification?.id;
    const medicine = detail.notification?.body?.split(' — ')[0] ?? 'your medicine';
    if (id) await snoozeReminder(id, medicine);
  }
});

AppRegistry.registerComponent(appName, () => App);

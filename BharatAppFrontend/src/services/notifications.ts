import {Platform} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';

/** One Android notification channel for every medicine reminder. */
const CHANNEL_ID = 'medicine-reminders';

/** Notifee action id used by the "Snooze" button on the notification itself. */
export const SNOOZE_ACTION_ID = 'snooze';
const SNOOZE_MINUTES = 10;

let channelReady: Promise<void> | null = null;

/** Creates the Android channel / iOS category (with the Snooze action) once. */
const ensureChannel = (): Promise<void> => {
  if (!channelReady) {
    channelReady = (async () => {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: 'Medicine reminders',
          importance: AndroidImportance.HIGH,
        });
      } else {
        await notifee.setNotificationCategories([
          {
            id: 'medicine-reminder',
            actions: [{id: SNOOZE_ACTION_ID, title: `Snooze ${SNOOZE_MINUTES} min`}],
          },
        ]);
      }
    })();
  }
  return channelReady;
};

/**
 * Requests notification permission (iOS prompt / Android 13+ POST_NOTIFICATIONS).
 * Returns whether the app is allowed to show notifications.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
};

/**
 * Android 12+ blocks *exact* alarms behind a separate user-granted setting.
 * We degrade gracefully (approximate timing) rather than forcing the user
 * out to system settings — good enough for a dose reminder.
 */
const canScheduleExact = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const settings = await notifee.getNotificationSettings();
  return settings.android.alarm === AndroidNotificationSetting.ENABLED;
};

export interface ScheduleReminderInput {
  /** Stable id for this reminder — reused as the notifee notification id so
   * it can be cancelled/rescheduled later. */
  id: string;
  medicine: string;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  /** Fires every day at the given time when true; a single one-off otherwise. */
  repeatDaily: boolean;
}

/** Next occurrence of hour:minute — today if still upcoming, else tomorrow. */
const nextTrigger = (hour: number, minute: number): Date => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
};

/** Schedules (or reschedules) a daily/one-off dose reminder. */
export const scheduleReminder = async ({
  id,
  medicine,
  hour,
  minute,
  repeatDaily,
}: ScheduleReminderInput): Promise<void> => {
  await ensureChannel();
  const allowed = await requestNotificationPermission();
  if (!allowed) {
    throw new Error('Notifications are disabled — enable them in system settings to get reminders.');
  }

  const exact = await canScheduleExact();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextTrigger(hour, minute).getTime(),
    ...(repeatDaily ? {repeatFrequency: RepeatFrequency.DAILY} : {}),
    alarmManager: exact ? {allowWhileIdle: true} : {allowWhileIdle: true},
  };

  await notifee.createTriggerNotification(
    {
      id,
      title: 'Time for your medicine',
      body: `${medicine} — tap to mark as taken, or snooze ${SNOOZE_MINUTES} min.`,
      android: {
        channelId: CHANNEL_ID,
        pressAction: {id: 'default'},
        actions: [{title: `Snooze ${SNOOZE_MINUTES} min`, pressAction: {id: SNOOZE_ACTION_ID}}],
      },
      ios: {
        categoryId: 'medicine-reminder',
      },
    },
    trigger,
  );
};

/** Cancels a reminder's scheduled + any currently-displayed notification. */
export const cancelReminder = async (id: string): Promise<void> => {
  await notifee.cancelNotification(id);
  await notifee.cancelTriggerNotification(id);
};

/** Reschedules a fired reminder `minutes` from now (used by the Snooze action). */
export const snoozeReminder = async (id: string, medicine: string, minutes = SNOOZE_MINUTES): Promise<void> => {
  await ensureChannel();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: Date.now() + minutes * 60 * 1000,
  };
  await notifee.createTriggerNotification(
    {
      id,
      title: 'Time for your medicine (snoozed)',
      body: `${medicine} — tap to mark as taken, or snooze again.`,
      android: {
        channelId: CHANNEL_ID,
        pressAction: {id: 'default'},
        actions: [{title: `Snooze ${SNOOZE_MINUTES} min`, pressAction: {id: SNOOZE_ACTION_ID}}],
      },
      ios: {categoryId: 'medicine-reminder'},
    },
    trigger,
  );
};

/**
 * Foreground event bridge (app open when the action is tapped). Background
 * events (app killed/backgrounded) are handled separately in index.js via
 * notifee.onBackgroundEvent, which must be registered outside React.
 */
export const onForegroundNotificationEvent = notifee.onForegroundEvent;
export {EventType};

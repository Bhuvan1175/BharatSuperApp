import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {storage} from '../utils/storage';
import {uid} from '../utils/helpers';
import {
  cancelReminder,
  EventType,
  onForegroundNotificationEvent,
  scheduleReminder,
  SNOOZE_ACTION_ID,
  snoozeReminder,
} from '../services/notifications';
import {navigateTo} from '../navigation/navigationRef';

export interface MedicineReminder {
  id: string;
  medicine: string;
  /** 0–23 */
  hour: number;
  /** 0–59 */
  minute: number;
  repeatDaily: boolean;
  createdAt: number;
}

const STORAGE_KEY = '@bsa/medicine_reminders';

interface RemindersContextValue {
  reminders: MedicineReminder[];
  loading: boolean;
  addReminder: (input: {medicine: string; hour: number; minute: number; repeatDaily: boolean}) => Promise<void>;
  removeReminder: (id: string) => Promise<void>;
}

const RemindersContext = createContext<RemindersContextValue | undefined>(undefined);

export const RemindersProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const remindersRef = React.useRef<MedicineReminder[]>([]);
  remindersRef.current = reminders;

  useEffect(() => {
    storage.get<MedicineReminder[]>(STORAGE_KEY).then(r => {
      setReminders(r ?? []);
      setLoading(false);
    });
  }, []);

  // Foreground bridge: tapping a reminder notification opens the reminders
  // screen; tapping "Snooze" reschedules it. The killed/backgrounded case is
  // handled by the equivalent onBackgroundEvent handler in index.js.
  useEffect(() => {
    const unsubscribe = onForegroundNotificationEvent(async ({type, detail}) => {
      const id = detail.notification?.id;
      if (!id) return;
      const medicine = remindersRef.current.find(r => r.id === id)?.medicine ?? 'your medicine';

      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === SNOOZE_ACTION_ID) {
        await snoozeReminder(id, medicine);
      } else if (type === EventType.PRESS) {
        navigateTo('MedicineReminders');
      }
    });
    return unsubscribe;
  }, []);

  const addReminder = useCallback(
    async (input: {medicine: string; hour: number; minute: number; repeatDaily: boolean}) => {
      const reminder: MedicineReminder = {
        id: uid('reminder'),
        medicine: input.medicine,
        hour: input.hour,
        minute: input.minute,
        repeatDaily: input.repeatDaily,
        createdAt: Date.now(),
      };
      // Schedule the OS notification first — if it throws (e.g. permission
      // denied), we don't persist a reminder that will never fire.
      await scheduleReminder(reminder);
      setReminders(prev => {
        const next = [reminder, ...prev];
        storage.set(STORAGE_KEY, next);
        return next;
      });
    },
    [],
  );

  const removeReminder = useCallback(async (id: string) => {
    await cancelReminder(id);
    setReminders(prev => {
      const next = prev.filter(r => r.id !== id);
      storage.set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<RemindersContextValue>(
    () => ({reminders, loading, addReminder, removeReminder}),
    [reminders, loading, addReminder, removeReminder],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
};

export const useReminders = (): RemindersContextValue => {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used within a RemindersProvider');
  return ctx;
};

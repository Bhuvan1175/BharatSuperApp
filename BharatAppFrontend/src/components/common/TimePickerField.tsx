import React, {useState} from 'react';
import {View, Pressable, Modal} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Format 24h hour/minute as "8:05 AM". */
export const formatTime12h = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${pad(minute)} ${period}`;
};

interface Props {
  label?: string;
  /** 24h hour (0–23). */
  hour: number;
  /** Minute (0–59). */
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

/**
 * Pure-JS time picker — a tappable field that opens a stepper modal (hour /
 * 5-min steps / AM-PM). No native dependency, matching DatePickerField, so it
 * works without an app rebuild.
 */
const TimePickerField: React.FC<Props> = ({label, hour, minute, onChange}) => {
  const {theme} = useTheme();
  const [open, setOpen] = useState(false);

  const period: 'AM' | 'PM' = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;

  const setH12 = (nextH12: number, nextPeriod: 'AM' | 'PM') => {
    const wrapped = ((nextH12 - 1 + 12) % 12) + 1;
    let next24 = wrapped % 12;
    if (nextPeriod === 'PM') next24 += 12;
    onChange(next24, minute);
  };

  const stepHour = (delta: number) => setH12(h12 + delta, period);
  const stepMinute = (delta: number) => onChange(hour, (minute + delta + 60) % 60);
  const togglePeriod = () => setH12(h12, period === 'AM' ? 'PM' : 'AM');

  const Stepper: React.FC<{value: string; onDec: () => void; onInc: () => void}> = ({value, onDec, onInc}) => (
    <View style={{alignItems: 'center'}}>
      <Pressable hitSlop={10} onPress={onInc} style={{padding: 6}}>
        <Icon name="chevron-up" size={22} color={theme.colors.primary} />
      </Pressable>
      <AppText variant="h2" style={{minWidth: 56, textAlign: 'center'}}>
        {value}
      </AppText>
      <Pressable hitSlop={10} onPress={onDec} style={{padding: 6}}>
        <Icon name="chevron-down" size={22} color={theme.colors.primary} />
      </Pressable>
    </View>
  );

  return (
    <View style={{marginBottom: theme.spacing.lg}}>
      {label && (
        <AppText variant="label" muted style={{marginBottom: theme.spacing.xs}}>
          {label}
        </AppText>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 52,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        }}>
        <Icon name="clock" size={18} color={theme.colors.textMuted} />
        <AppText variant="body" style={{flex: 1}}>
          {formatTime12h(hour, minute)}
        </AppText>
        <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: theme.spacing.lg}}>
          <Pressable
            onPress={() => {}}
            style={{backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.lg}}>
            <AppText variant="bodyStrong" center style={{marginBottom: theme.spacing.md}}>
              Reminder time
            </AppText>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.lg}}>
              <Stepper value={String(h12)} onDec={() => stepHour(-1)} onInc={() => stepHour(1)} />
              <AppText variant="h2">:</AppText>
              <Stepper value={pad(minute)} onDec={() => stepMinute(-5)} onInc={() => stepMinute(5)} />
              <Pressable
                onPress={togglePeriod}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.primarySoft,
                }}>
                <AppText variant="bodyStrong" color={theme.colors.primary}>
                  {period}
                </AppText>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              style={{
                marginTop: theme.spacing.lg,
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.md,
                paddingVertical: theme.spacing.md,
                alignItems: 'center',
              }}>
              <AppText variant="bodyStrong" color={theme.colors.textInverse}>
                Done
              </AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default TimePickerField;

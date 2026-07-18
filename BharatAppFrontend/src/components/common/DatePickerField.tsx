import React, {useState} from 'react';
import {View, Pressable, Modal} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const parseISO = (iso?: string): {y: number; m: number; d: number} | null => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = +match[1];
  const m = +match[2] - 1;
  const d = +match[3];
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  return {y, m, d};
};

/** Format an ISO date (yyyy-mm-dd) as "10 Jul 2026". '' if empty/invalid. */
export const formatDate = (iso?: string): string => {
  const p = parseISO(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}` : '';
};

interface Props {
  label?: string;
  /** ISO yyyy-mm-dd, or undefined for no date. */
  value?: string;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
}

/**
 * Pure-JS date picker — a tappable field that opens a month calendar in a modal.
 * No native dependency, so it works without an app rebuild. Emits an ISO
 * yyyy-mm-dd string (or undefined when cleared).
 */
const DatePickerField: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
}) => {
  const {theme} = useTheme();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewY, setViewY] = useState(
    parseISO(value)?.y ?? today.getFullYear(),
  );
  const [viewM, setViewM] = useState(parseISO(value)?.m ?? today.getMonth());

  const openPicker = () => {
    const p = parseISO(value);
    setViewY(p?.y ?? today.getFullYear());
    setViewM(p?.m ?? today.getMonth());
    setOpen(true);
  };

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstWeekday = new Date(viewY, viewM, 1).getDay(); // 0 = Sunday
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selected = parseISO(value);

  const prevMonth = () =>
    viewM === 0 ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1);
  const nextMonth = () =>
    viewM === 11 ? (setViewM(0), setViewY(y => y + 1)) : setViewM(m => m + 1);

  const pick = (d: number) => {
    onChange(toISO(viewY, viewM, d));
    setOpen(false);
  };
  const selectToday = () => {
    const t = new Date();
    onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate()));
    setOpen(false);
  };
  const clear = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <View style={{marginBottom: theme.spacing.lg}}>
      {label && (
        <AppText variant="label" muted style={{marginBottom: theme.spacing.xs}}>
          {label}
        </AppText>
      )}

      <Pressable
        onPress={openPicker}
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
        <Icon name="calendar" size={18} color={theme.colors.textMuted} />
        <AppText
          variant="body"
          style={{flex: 1}}
          color={value ? theme.colors.text : theme.colors.textMuted}>
          {value ? formatDate(value) : placeholder}
        </AppText>
        {!!value && (
          <Pressable hitSlop={8} onPress={clear}>
            <Icon name="x" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: theme.spacing.lg,
          }}>
          {/* Inner press catcher so taps on the card don't close the modal. */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            }}>
            {/* Month navigation */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.md,
              }}>
              <Pressable hitSlop={10} onPress={prevMonth}>
                <Icon name="chevron-left" size={24} />
              </Pressable>
              <AppText variant="bodyStrong">
                {MONTHS[viewM]} {viewY}
              </AppText>
              <Pressable hitSlop={10} onPress={nextMonth}>
                <Icon name="chevron-right" size={24} />
              </Pressable>
            </View>

            {/* Weekday headings */}
            <View style={{flexDirection: 'row'}}>
              {WEEKDAYS.map(w => (
                <View key={w} style={{flex: 1, alignItems: 'center', paddingVertical: 4}}>
                  <AppText variant="caption" muted>
                    {w}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
              {cells.map((d, i) => {
                const isSel =
                  !!d &&
                  !!selected &&
                  selected.y === viewY &&
                  selected.m === viewM &&
                  selected.d === d;
                return (
                  <View
                    key={i}
                    style={{width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4}}>
                    {d ? (
                      <Pressable
                        onPress={() => pick(d)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSel ? theme.colors.primary : 'transparent',
                        }}>
                        <AppText
                          variant="body"
                          color={isSel ? theme.colors.textInverse : theme.colors.text}>
                          {d}
                        </AppText>
                      </Pressable>
                    ) : (
                      <View style={{width: 36, height: 36}} />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Actions */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: theme.spacing.md,
              }}>
              <Pressable hitSlop={8} onPress={clear}>
                <AppText variant="label" color={theme.colors.danger}>
                  Clear
                </AppText>
              </Pressable>
              <Pressable hitSlop={8} onPress={selectToday}>
                <AppText variant="label" color={theme.colors.primary}>
                  Today
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default DatePickerField;

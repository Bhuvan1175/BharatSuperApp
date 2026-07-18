import React, {useState} from 'react';
import {View, Alert, Switch, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useReminders} from '../../context/RemindersContext';
import {Screen, Header, Card, Button, AppText, Icon, Input, EmptyState, TimePickerField} from '../../components/common';
import {formatTime12h} from '../../components/common/TimePickerField';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicineReminders'>;

/**
 * E5-S4 — Medicine reminders. Real, scheduled local notifications (via
 * notifee) that fire at the chosen time, daily or once, with a Snooze action
 * on the notification itself (handled in services/notifications.ts + the
 * background handler registered in index.js).
 */
const MedicineRemindersScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {reminders, loading, addReminder, removeReminder} = useReminders();

  const [medicine, setMedicine] = useState(route.params?.medicine ?? '');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [repeatDaily, setRepeatDaily] = useState(true);
  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    if (!medicine.trim()) {
      Alert.alert('Medicine name required', 'Please enter what to remind you about.');
      return;
    }
    setSaving(true);
    try {
      await addReminder({medicine: medicine.trim(), hour, minute, repeatDaily});
      setMedicine('');
      Alert.alert('Reminder set', `We'll remind you at ${formatTime12h(hour, minute)}${repeatDaily ? ', every day' : ''}.`);
    } catch (e) {
      Alert.alert('Could not set reminder', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onRemove = (id: string, name: string) => {
    Alert.alert('Remove reminder?', `Stop reminding you about ${name}.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => removeReminder(id)},
    ]);
  };

  return (
    <Screen scroll padded>
      <Header title="Medicine reminders" onBack={() => navigation.goBack()} />

      <Card style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}>
        <AppText variant="bodyStrong" style={{marginBottom: theme.spacing.md}}>
          New reminder
        </AppText>
        <Input
          label="Medicine"
          icon="package"
          value={medicine}
          onChangeText={setMedicine}
          placeholder="e.g. Dolo 650"
          containerStyle={{marginBottom: theme.spacing.lg}}
        />
        <TimePickerField
          label="Time"
          hour={hour}
          minute={minute}
          onChange={(h, m) => {
            setHour(h);
            setMinute(m);
          }}
        />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg}}>
          <View>
            <AppText variant="body">Repeat daily</AppText>
            <AppText variant="caption" muted>
              Off = remind me once
            </AppText>
          </View>
          <Switch value={repeatDaily} onValueChange={setRepeatDaily} trackColor={{true: theme.colors.primary}} />
        </View>
        <Button label="Set reminder" icon="bell" onPress={onAdd} loading={saving} disabled={saving} />
      </Card>

      <AppText variant="h3" style={{marginBottom: theme.spacing.md}}>
        Your reminders
      </AppText>
      {loading ? null : !reminders.length ? (
        <EmptyState icon="bell-off" title="No reminders yet" subtitle="Set one above so you never miss a dose." />
      ) : (
        reminders.map(r => (
          <Card key={r.id} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
            <View style={{width: 40, height: 40, borderRadius: theme.radius.md, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center'}}>
              <Icon name="bell" size={18} color={theme.colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="title" numberOfLines={1}>
                {r.medicine}
              </AppText>
              <AppText variant="caption" muted>
                {formatTime12h(r.hour, r.minute)} · {r.repeatDaily ? 'Every day' : 'Once'}
              </AppText>
            </View>
            <Pressable hitSlop={8} onPress={() => onRemove(r.id, r.medicine)}>
              <Icon name="trash-2" size={18} color={theme.colors.danger} />
            </Pressable>
          </Card>
        ))
      )}
    </Screen>
  );
};

export default MedicineRemindersScreen;

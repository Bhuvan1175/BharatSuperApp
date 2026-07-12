import React, {useState} from 'react';
import {View, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, Card, AppText} from '@components/common';
import {getApiErrorMessage} from '../../api/errors';
import {useUpdateDepartment, useDeleteDepartment} from '../../hooks/useAdmin';
import {UpdateDepartmentBody} from '../../api/admin.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AdminEditDepartment'>;

const EditDepartmentScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const dept = params.department;

  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const [label, setLabel] = useState(dept.label ?? '');

  const onSave = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      Alert.alert('Label required', 'Please enter a display label.');
      return;
    }
    const body: UpdateDepartmentBody = {label: trimmed};
    updateDept.mutate(
      {id: dept.id, body},
      {
        onSuccess: () => {
          Alert.alert('Saved', 'Department updated.');
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  const onDelete = () => {
    Alert.alert(
      `Delete ${dept.label ?? dept.name}?`,
      'This deletes the department. Any officers assigned to it are moved back ' +
        'to regular citizen accounts (their department and role are removed). ' +
        'This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteDept.mutate(dept.id, {
              onSuccess: () => {
                Alert.alert('Deleted', `"${dept.name}" was deleted.`);
                navigation.goBack();
              },
              onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
            }),
        },
      ],
    );
  };

  const busy = updateDept.isPending || deleteDept.isPending;

  return (
    <Screen scroll padded>
      <Header title="Edit department" onBack={() => navigation.goBack()} />

      {/* Immutable identity — shown read-only. */}
      <Card style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <AppText variant="caption" muted>
            Name (locked)
          </AppText>
          <AppText variant="caption">{dept.name}</AppText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.xs,
          }}>
          <AppText variant="caption" muted>
            Module key (locked)
          </AppText>
          <AppText variant="caption">{dept.moduleKey}</AppText>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: theme.spacing.xs,
          }}>
          <AppText variant="caption" muted>
            Manager role
          </AppText>
          <AppText variant="caption">{dept.defaultRole?.name ?? '—'}</AppText>
        </View>
      </Card>

      <Input
        label="Label (shown in UI)"
        icon="tag"
        value={label}
        onChangeText={setLabel}
        placeholder="Medicine"
        containerStyle={{marginBottom: theme.spacing.md}}
      />
      <AppText variant="caption" muted style={{marginBottom: theme.spacing.xl}}>
        Only the display label can be changed. The internal name and module key
        are locked because roles, permissions and app routing depend on them.
      </AppText>

      <Button
        label="Save changes"
        icon="check"
        onPress={onSave}
        loading={updateDept.isPending}
        disabled={busy}
      />

      <Button
        label="Delete department"
        icon="trash-2"
        variant="danger"
        onPress={onDelete}
        loading={deleteDept.isPending}
        disabled={busy}
        style={{marginTop: theme.spacing.md}}
      />
    </Screen>
  );
};

export default EditDepartmentScreen;

import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText} from '@components/common';
import {getApiErrorMessage} from '../../api/errors';
import {useCreateDepartment} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AddDepartmentScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const createDept = useCreateDepartment();

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [moduleKey, setModuleKey] = useState('');

  const nameValid = /^[A-Z][A-Z0-9_]*$/.test(name);
  const keyValid = /^[a-z][a-z0-9_]*$/.test(moduleKey);

  const onSubmit = () => {
    if (!nameValid || !keyValid) {
      Alert.alert('Check fields', 'Name must be UPPER_SNAKE_CASE and module key lower_snake_case.');
      return;
    }
    createDept.mutate(
      {name, label: label.trim() || undefined, moduleKey},
      {
        onSuccess: () => {
          Alert.alert('Created', `Department "${name}" and its manager role were created.`);
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Screen scroll padded>
      <Header title="Add department" onBack={() => navigation.goBack()} />

      <Input
        label="Name (UPPER_SNAKE_CASE)"
        icon="hash"
        value={name}
        onChangeText={txt => setName(txt.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
        placeholder="TRANSPORT"
        autoCapitalize="characters"
        autoCorrect={false}
        containerStyle={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Label (shown in UI)"
        icon="tag"
        value={label}
        onChangeText={setLabel}
        placeholder="Transport"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Module key (lower_snake_case)"
        icon="box"
        value={moduleKey}
        onChangeText={txt => setModuleKey(txt.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        placeholder="transport"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={{marginBottom: theme.spacing.md}}
      />

      <AppText variant="caption" muted style={{marginBottom: theme.spacing.lg}}>
        A manager role "{name || 'NAME'}_MANAGER" with{' '}
        {moduleKey || 'module'}:view / :manage will be created and linked
        automatically.
      </AppText>

      <Button
        label="Create department"
        icon="check"
        onPress={onSubmit}
        loading={createDept.isPending}
        disabled={createDept.isPending || !nameValid || !keyValid}
      />
    </Screen>
  );
};

export default AddDepartmentScreen;

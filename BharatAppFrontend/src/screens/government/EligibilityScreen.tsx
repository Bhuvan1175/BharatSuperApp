import React, {useState} from 'react';
import {View, ScrollView, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {INDIAN_STATES, OCCUPATIONS, GENDERS} from '../../constants/categories';
import {EligibilityProfile} from '../../types';
import {Screen, Header, Input, Button, AppText} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Eligibility'>;

const Selector: React.FC<{
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}> = ({label, options, value, onSelect}) => {
  const {theme} = useTheme();
  return (
    <View style={{marginTop: theme.spacing.lg}}>
      <AppText variant="label" muted style={{marginBottom: theme.spacing.sm}}>
        {label}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: theme.spacing.sm}}>
        {options.map(o => {
          const active = value === o;
          return (
            <Pressable
              key={o}
              onPress={() => onSelect(o)}
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.colors.primary : theme.colors.cardAlt,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              }}>
              <AppText variant="label" color={active ? theme.colors.textInverse : theme.colors.text}>
                {o}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const EligibilityScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [profile, setProfile] = useState<EligibilityProfile>({
    age: '',
    occupation: 'Student',
    income: '',
    state: 'Maharashtra',
    gender: 'Female',
  });

  const set = (k: keyof EligibilityProfile, v: string) => setProfile(p => ({...p, [k]: v}));
  const valid = profile.age.length > 0 && profile.income.length > 0;

  return (
    <Screen scroll padded>
      <Header title={t.government.eligibilityTitle} onBack={() => navigation.goBack()} />
      <AppText variant="body" muted style={{marginTop: theme.spacing.sm}}>
        Fill in a few details and I'll match schemes you qualify for.
      </AppText>

      <Input
        containerStyle={{marginTop: theme.spacing.lg}}
        label={t.government.age}
        placeholder="e.g. 24"
        keyboardType="number-pad"
        icon="user"
        value={profile.age}
        onChangeText={v => set('age', v.replace(/[^0-9]/g, ''))}
      />
      <Selector label={t.government.occupation} options={OCCUPATIONS} value={profile.occupation} onSelect={v => set('occupation', v)} />
      <Input
        containerStyle={{marginTop: theme.spacing.lg}}
        label={t.government.income}
        placeholder="e.g. 250000"
        keyboardType="number-pad"
        icon="dollar-sign"
        value={profile.income}
        onChangeText={v => set('income', v.replace(/[^0-9]/g, ''))}
      />
      <Selector label={t.government.state} options={INDIAN_STATES} value={profile.state} onSelect={v => set('state', v)} />
      <Selector label={t.government.gender} options={GENDERS} value={profile.gender} onSelect={v => set('gender', v)} />

      <Button
        label={t.government.runCheck}
        icon="search"
        disabled={!valid}
        onPress={() => navigation.navigate('SchemeResults', {})}
        style={{marginTop: theme.spacing.xxl}}
      />
    </Screen>
  );
};

export default EligibilityScreen;

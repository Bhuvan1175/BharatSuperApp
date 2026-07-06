import React from 'react';
import {View, Switch, Pressable, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../hooks/useTranslation';
import {languageOptions} from '../../localization';
import {AIPersonality, LanguageCode} from '../../types';
import {Screen, Header, Card, AppText, Icon, ListRow, Divider, SectionHeader} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const PERSONALITIES: AIPersonality[] = ['friendly', 'concise', 'formal', 'detailed'];

const SettingsScreen: React.FC<Props> = ({navigation}) => {
  const {theme, isDark, toggleTheme} = useTheme();
  const {t, language, setLanguage} = useTranslation();
  const {user, setAiPersonality} = useAuth();
  const [notifications, setNotifications] = React.useState(true);

  return (
    <Screen scroll padded>
      <Header title={t.profile.settings} onBack={() => navigation.goBack()} />

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card padded={false} style={{paddingHorizontal: theme.spacing.lg}}>
        <ListRow
          icon={isDark ? 'moon' : 'sun'}
          title={t.profile.darkMode}
          right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{true: theme.colors.primary, false: theme.colors.border}} thumbColor="#fff" />}
        />
      </Card>

      {/* Language */}
      <SectionHeader title={t.profile.language} />
      <Card>
        <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
          {languageOptions.map(opt => {
            const active = language === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => setLanguage(opt.code as LanguageCode)}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.cardAlt,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                }}>
                <AppText variant="bodyStrong" color={active ? theme.colors.primary : theme.colors.text}>
                  {opt.native}
                </AppText>
                <AppText variant="caption" muted>
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* AI personality */}
      <SectionHeader title={t.profile.aiPersonality} />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm}}>
        {PERSONALITIES.map(p => {
          const active = user?.aiPersonality === p;
          return (
            <Pressable
              key={p}
              onPress={() => setAiPersonality(p)}
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.colors.primary : theme.colors.cardAlt,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              }}>
              <AppText variant="label" color={active ? theme.colors.textInverse : theme.colors.text}>
                {t.personalities[p]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Notifications & privacy */}
      <SectionHeader title="Preferences" />
      <Card padded={false} style={{paddingHorizontal: theme.spacing.lg}}>
        <ListRow
          icon="bell"
          title={t.profile.notifications}
          right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{true: theme.colors.primary, false: theme.colors.border}} thumbColor="#fff" />}
        />
        <Divider spacing={0} />
        <ListRow icon="shield" title={t.profile.privacy} subtitle="Review permissions" showChevron onPress={() => {}} />
        <Divider spacing={0} />
        <ListRow
          icon="trash-2"
          iconColor={theme.colors.danger}
          title={t.profile.deleteData}
          showChevron
          onPress={() =>
            Alert.alert(t.profile.deleteData, 'This will permanently delete your data. This action cannot be undone.', [
              {text: t.common.cancel, style: 'cancel'},
              {text: 'Delete', style: 'destructive'},
            ])
          }
        />
      </Card>

      <View style={{flexDirection: 'row', gap: 6, marginTop: theme.spacing.lg, alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="lock" size={13} color={theme.colors.textMuted} />
        <AppText variant="caption" muted>
          Your data is encrypted and DPDP-compliant.
        </AppText>
      </View>
    </Screen>
  );
};

export default SettingsScreen;

import React from 'react';
import {View, ScrollView, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {AppText, Avatar, Card, Icon, Button, SectionHeader, ListRow, Divider} from '../../components/common';
import {useAuthStore} from '../../store/authStore';
import {useProfile} from '../../hooks/useProfile';
import {useCompleteProfile} from '../../hooks/useCompleteProfile';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  username: 'Username',
  bio: 'Bio',
  profileImage: 'Photo',
};

const ProfileScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const {saved} = useAppData();
  const navigation = useNavigation<Nav>();

  // Refresh the profile + completion from the backend whenever this screen mounts.
  useProfile();
  const {data: completion} = useCompleteProfile();

  const savedGroups = [
    {key: 'medicines', label: t.profile.medicines, icon: 'plus-square', count: saved.medicines.length},
    {key: 'areas', label: t.profile.areas, icon: 'map-pin', count: saved.areas.length},
    {key: 'routes', label: t.profile.routes, icon: 'navigation', count: saved.routes.length},
    {key: 'schemes', label: t.profile.schemes, icon: 'award', count: saved.schemes.length},
  ];

  const pct = completion?.completionPercentage ?? 0;
  const missing = completion?.missingFields ?? [];
  const showCompletion = !!completion && !completion.profileCompleted;

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: theme.spacing.lg, paddingBottom: theme.spacing.giant}}>
        <AppText variant="h2">{t.profile.title}</AppText>

        {/* Header card — real user from the backend */}
        <Card style={{marginTop: theme.spacing.lg, alignItems: 'center'}}>
          <Avatar name={user?.name || 'User'} uri={user?.profileImage || undefined} size={84} />
          <AppText variant="h3" style={{marginTop: theme.spacing.md}}>
            {user?.name || 'Add your name'}
          </AppText>
          {!!user?.username && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
              <Icon name="at-sign" size={13} color={theme.colors.textMuted} />
              <AppText variant="caption" muted>
                {user.username}
              </AppText>
            </View>
          )}
          <AppText variant="caption" muted style={{marginTop: 2}}>
            +91 {user?.phoneNumber}
          </AppText>
          {!!user?.bio && (
            <AppText variant="caption" muted center style={{marginTop: theme.spacing.sm}}>
              {user.bio}
            </AppText>
          )}
          <Button label={t.profile.editProfile} icon="edit-2" variant="outline" size="sm" fullWidth={false} style={{marginTop: theme.spacing.md}} onPress={() => navigation.navigate('EditProfile')} />
        </Card>

        {/* Profile completion */}
        {showCompletion && (
          <Card style={{marginTop: theme.spacing.lg}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <AppText variant="bodyStrong">Profile completion</AppText>
              <AppText variant="bodyStrong" color={theme.colors.primary}>
                {pct}%
              </AppText>
            </View>
            <View style={{height: 8, borderRadius: 4, backgroundColor: theme.colors.cardAlt, marginTop: theme.spacing.sm, overflow: 'hidden'}}>
              <View style={{height: '100%', width: `${pct}%`, backgroundColor: theme.colors.primary}} />
            </View>
            {missing.length > 0 && (
              <>
                <AppText variant="caption" muted style={{marginTop: theme.spacing.md}}>
                  Add these to complete your profile:
                </AppText>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm}}>
                  {missing.map(f => (
                    <View key={f} style={{paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.pill, backgroundColor: theme.colors.primarySoft}}>
                      <AppText variant="caption" color={theme.colors.primary}>
                        {FIELD_LABELS[f] ?? f}
                      </AppText>
                    </View>
                  ))}
                </View>
                <Button label="Complete profile" icon="arrow-right" size="sm" fullWidth={false} style={{marginTop: theme.spacing.md}} onPress={() => navigation.navigate('EditProfile')} />
              </>
            )}
          </Card>
        )}

        {/* Saved */}
        <SectionHeader title={t.profile.saved} actionLabel={t.common.seeAll} onAction={() => navigation.navigate('Saved')} />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md}}>
          {savedGroups.map(g => (
            <Pressable key={g.key} onPress={() => navigation.navigate('Saved')} style={{width: '47.5%'}}>
              <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
                <View style={{width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center'}}>
                  <Icon name={g.icon} size={19} color={theme.colors.primary} />
                </View>
                <View>
                  <AppText variant="h3">{g.count}</AppText>
                  <AppText variant="caption" muted>
                    {g.label}
                  </AppText>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        {/* Settings entry */}
        <SectionHeader title={t.profile.settings} />
        <Card padded={false} style={{paddingHorizontal: theme.spacing.lg}}>
          <ListRow icon="search" title="Find people" subtitle="Search users by name or username" showChevron onPress={() => navigation.navigate('UserSearch')} />
          <Divider spacing={0} />
          <ListRow icon="settings" title={t.profile.settings} subtitle="Theme, language, notifications, AI personality" showChevron onPress={() => navigation.navigate('Settings')} />
          <Divider spacing={0} />
          <ListRow icon="shield" title={t.profile.privacy} subtitle="Permissions & data controls" showChevron onPress={() => navigation.navigate('Settings')} />
          <Divider spacing={0} />
          <ListRow icon="help-circle" title="Help & support" showChevron onPress={() => {}} />
        </Card>

        <Button label={t.profile.logout} icon="log-out" variant="ghost" style={{marginTop: theme.spacing.lg}} onPress={logout} />
        <AppText variant="caption" muted center style={{marginTop: theme.spacing.md}}>
          Bharat Super App · v1.0.0
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

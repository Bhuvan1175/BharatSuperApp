import React, {useEffect, useState} from 'react';
import {View, ScrollView, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {navigateTo} from '../../navigation/navigationRef';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {useRotatingText} from '../../hooks/useRotatingText';
import {QUICK_ACTIONS} from '../../constants/quickActions';
import {alertsService} from '../../services/alertsService';
import {LocalAlert} from '../../types';
import {
  AppText,
  SearchBar,
  QuickActionTile,
  SectionHeader,
  Avatar,
  Icon,
  FadeInView,
} from '../../components/common';
import {AlertCard} from '../../components/cards';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {user} = useAuth();
  const {recents, addRecent} = useAppData();
  const navigation = useNavigation<Nav>();
  const placeholder = useRotatingText(t.home.searchPlaceholders);
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);

  useEffect(() => {
    alertsService.getAlerts().then(setAlerts);
  }, []);

  const openChat = (query?: string) => {
    if (query) addRecent(query);
    navigation.navigate('AIChat', {initialQuery: query});
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: theme.spacing.giant}}>
        {/* Greeting header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
          }}>
          <View style={{flex: 1, paddingRight: theme.spacing.md}}>
            <AppText variant="body" muted numberOfLines={1}>
              {t.home.greeting}, 🙏
            </AppText>
            <AppText variant="h2" numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'there'}</AppText>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
              <Icon name="map-pin" size={13} color={theme.colors.primary} />
              <AppText variant="caption" muted numberOfLines={1} style={{flexShrink: 1}}>
                {user?.location ?? 'Set your location'}
              </AppText>
            </View>
          </View>
          <Pressable onPress={() => navigateTo('ProfileTab')}>
            <Avatar name={user?.name ?? 'User'} uri={user?.avatar} size={46} />
          </Pressable>
        </View>

        {/* AI search bar */}
        <FadeInView style={{paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.xl}}>
          <SearchBar placeholder={placeholder} onPress={() => openChat()} onVoicePress={() => openChat()} />
        </FadeInView>

        {/* Quick actions */}
        <View style={{marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg}}>
          <SectionHeader title={t.home.quickActions} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md}}>
          {QUICK_ACTIONS.map((qa, i) => (
            <FadeInView key={qa.id} delay={i * 40}>
              <QuickActionTile
                label={qa.labelKey}
                icon={qa.icon}
                color={qa.color}
                onPress={() => navigateTo(qa.route)}
              />
            </FadeInView>
          ))}
        </ScrollView>

        {/* Recent searches */}
        <View style={{marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg}}>
          <SectionHeader title={t.home.recentSearches} />
          {recents.length === 0 ? (
            <AppText variant="caption" muted>
              {t.home.noRecents}
            </AppText>
          ) : (
            <View style={{gap: theme.spacing.sm}}>
              {recents.map(r => (
                <Pressable
                  key={r.id}
                  onPress={() => openChat(r.query)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}>
                  <Icon name="clock" size={16} color={theme.colors.textMuted} />
                  <AppText variant="body" style={{flex: 1}} numberOfLines={1}>
                    {r.query}
                  </AppText>
                  <Icon name="corner-up-left" size={16} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Local alerts */}
        <View style={{marginTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg}}>
          <SectionHeader title={t.home.localAlerts} actionLabel={t.common.viewAll} onAction={() => navigateTo('Utilities')} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: theme.spacing.lg}}>
          {alerts.map((a, i) => (
            <FadeInView key={a.id} delay={i * 60}>
              <AlertCard alert={a} onPress={() => navigateTo('Utilities')} />
            </FadeInView>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

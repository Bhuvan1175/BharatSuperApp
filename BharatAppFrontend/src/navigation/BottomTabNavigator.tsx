import React from 'react';
import {View, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MainTabParamList} from './types';
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from '../hooks/useTranslation';
import Icon from '../components/common/Icon';
import AppText from '../components/common/AppText';

import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import TravelScreen from '../screens/travel/TravelScreen';
import GovernmentScreen from '../screens/government/GovernmentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  HomeTab: 'home',
  ExploreTab: 'compass',
  TravelTab: 'navigation',
  GovernmentTab: 'award',
  ProfileTab: 'user',
};

const BottomTabNavigator: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const labels: Record<keyof MainTabParamList, string> = {
    HomeTab: t.tabs.home,
    ExploreTab: t.tabs.explore,
    TravelTab: t.tabs.travel,
    GovernmentTab: t.tabs.government,
    ProfileTab: t.tabs.profile,
  };

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          ...Platform.select({android: {elevation: 12}}),
        },
        tabBarIcon: ({focused}) => {
          const name = ICONS[route.name as keyof MainTabParamList];
          const color = focused ? theme.colors.navActive : theme.colors.navInactive;
          return (
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -8,
                    width: 30,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: theme.colors.navActive,
                  }}
                />
              )}
              <Icon name={name} size={23} color={color} />
            </View>
          );
        },
        tabBarLabel: ({focused}) => (
          <AppText
            variant="caption"
            color={focused ? theme.colors.navActive : theme.colors.navInactive}
            style={{fontSize: 10.5, marginTop: 2}}>
            {labels[route.name as keyof MainTabParamList]}
          </AppText>
        ),
      })}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="ExploreTab" component={ExploreScreen} />
      <Tab.Screen name="TravelTab" component={TravelScreen} />
      <Tab.Screen name="GovernmentTab" component={GovernmentScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;

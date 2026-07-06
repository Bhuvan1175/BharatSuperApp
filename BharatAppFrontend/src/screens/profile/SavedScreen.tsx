import React, {useState} from 'react';
import {View, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {navigateTo} from '../../navigation/navigationRef';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {SavedItems} from '../../types';
import {Screen, Header, Card, AppText, Icon, Chip, EmptyState, FadeInView} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Saved'>;
type Tab = keyof SavedItems;

const TABS: {key: Tab; icon: string; route: string}[] = [
  {key: 'medicines', icon: 'plus-square', route: 'Health'},
  {key: 'areas', icon: 'map-pin', route: 'ExploreTab'},
  {key: 'routes', icon: 'navigation', route: 'RoadTrip'},
  {key: 'schemes', icon: 'award', route: 'GovernmentTab'},
];

const SavedScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {saved, toggleSaved} = useAppData();
  const [tab, setTab] = useState<Tab>('medicines');

  const items = saved[tab];
  const activeTab = TABS.find(x => x.key === tab)!;
  const labels: Record<Tab, string> = {
    medicines: t.profile.medicines,
    areas: t.profile.areas,
    routes: t.profile.routes,
    schemes: t.profile.schemes,
  };

  return (
    <Screen scroll padded>
      <Header title={t.profile.saved} onBack={() => navigation.goBack()} />

      <View style={{flexDirection: 'row', gap: theme.spacing.sm, marginVertical: theme.spacing.md, flexWrap: 'wrap'}}>
        {TABS.map(x => (
          <Chip key={x.key} label={`${labels[x.key]} ${saved[x.key].length}`} icon={x.icon} selected={tab === x.key} onPress={() => setTab(x.key)} />
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState icon="bookmark" title={`No saved ${labels[tab].toLowerCase()}`} subtitle="Items you save will appear here for quick access." />
      ) : (
        items.map((item, i) => (
          <FadeInView key={item} delay={i * 40}>
            <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
              <View style={{width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center'}}>
                <Icon name={activeTab.icon} size={19} color={theme.colors.primary} />
              </View>
              <Pressable style={{flex: 1}} onPress={() => navigateTo(activeTab.route)}>
                <AppText variant="bodyStrong">{item}</AppText>
                <AppText variant="caption" muted>
                  Tap to open
                </AppText>
              </Pressable>
              <Pressable hitSlop={10} onPress={() => toggleSaved(tab, item)}>
                <Icon name="x" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </Card>
          </FadeInView>
        ))
      )}
    </Screen>
  );
};

export default SavedScreen;

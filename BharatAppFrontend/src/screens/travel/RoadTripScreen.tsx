import React, {useState} from 'react';
import {View, ScrollView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {travelService} from '../../services/travelService';
import {RoadTripStop} from '../../types';
import {formatDistance} from '../../utils/format';
import {Screen, Header, Input, Button, Card, AppText, Icon, EmptyState, FadeInView} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadTrip'>;

const STOP_META: Record<RoadTripStop['type'], {icon: string; color: string}> = {
  fuel: {icon: 'droplet', color: '#FF7A00'},
  food: {icon: 'coffee', color: '#F59E0B'},
  ev: {icon: 'battery-charging', color: '#22C55E'},
  stay: {icon: 'home', color: '#0057FF'},
  attraction: {icon: 'camera', color: '#8B5CF6'},
};

const RoadTripScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [route, setRoute] = useState('Mumbai → Goa');
  const [stops, setStops] = useState<RoadTripStop[]>([]);
  const [loading, setLoading] = useState(false);

  const plan = () => {
    if (!route.trim()) return;
    setLoading(true);
    travelService.planRoadTrip(route).then(s => {
      setStops(s);
      setLoading(false);
    });
  };

  return (
    <Screen scroll padded>
      <Header title={t.travel.roadTrip} onBack={() => navigation.goBack()} />
      <Input
        containerStyle={{marginTop: theme.spacing.md}}
        icon="map"
        placeholder={t.travel.roadTripPlaceholder}
        value={route}
        onChangeText={setRoute}
      />
      <Button label={t.travel.plan} icon="navigation" loading={loading} onPress={plan} style={{marginTop: theme.spacing.md}} />

      {stops.length === 0 && !loading ? (
        <EmptyState icon="map" title="Plan your journey" subtitle="Enter an origin and destination — I'll add fuel, food, EV chargers, stays and attractions along the way." />
      ) : (
        <View style={{marginTop: theme.spacing.xl}}>
          {stops.map((s, i) => {
            const meta = STOP_META[s.type];
            return (
              <FadeInView key={s.id} delay={i * 50}>
                <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
                  {/* Timeline */}
                  <View style={{alignItems: 'center'}}>
                    <View style={{width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.card, borderWidth: 2, borderColor: meta.color, alignItems: 'center', justifyContent: 'center'}}>
                      <Icon name={meta.icon} size={16} color={meta.color} />
                    </View>
                    {i < stops.length - 1 && <View style={{width: 2, flex: 1, backgroundColor: theme.colors.border, marginVertical: 2}} />}
                  </View>
                  <Card style={{flex: 1, marginBottom: theme.spacing.md}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                      <AppText variant="bodyStrong" style={{flex: 1}}>
                        {s.name}
                      </AppText>
                      <AppText variant="caption" muted>
                        {formatDistance(s.distanceKm)}
                      </AppText>
                    </View>
                    <AppText variant="caption" muted style={{marginTop: 2}}>
                      {s.detail}
                    </AppText>
                  </Card>
                </View>
              </FadeInView>
            );
          })}
        </View>
      )}
    </Screen>
  );
};

export default RoadTripScreen;

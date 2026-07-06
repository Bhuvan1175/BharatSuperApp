import React, {useEffect, useRef, useState} from 'react';
import {View, Pressable, Linking, Animated, Easing} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {emergencyService} from '../../services/emergencyService';
import {EMERGENCY_CONTACTS} from '../../data/emergency';
import {NearbyHelp} from '../../types';
import {APP_CONFIG} from '../../constants/config';
import {formatDistance} from '../../utils/format';
import {Screen, Header, Card, AppText, Icon, SectionHeader} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Emergency'>;

const HELP_META: Record<NearbyHelp['type'], {icon: string; labelKey: 'hospital' | 'bloodBank' | 'policeStation'}> = {
  hospital: {icon: 'activity', labelKey: 'hospital'},
  blood_bank: {icon: 'droplet', labelKey: 'bloodBank'},
  police: {icon: 'shield', labelKey: 'policeStation'},
};

const EmergencyScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [nearby, setNearby] = useState<NearbyHelp[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const ring = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    emergencyService.nearby().then(setNearby);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {toValue: 1.15, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true}),
        Animated.timing(ring, {toValue: 1, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);

  const dial = (num: string) => Linking.openURL(`tel:${num}`);

  const startSos = () => {
    if (active) return;
    setCountdown(APP_CONFIG.sosCountdownSeconds);
    timer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timer.current) clearInterval(timer.current);
          emergencyService.broadcastSos();
          setActive(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSos = () => {
    if (timer.current) clearInterval(timer.current);
    setCountdown(null);
    setActive(false);
  };

  return (
    <Screen scroll padded backgroundColor={theme.colors.background}>
      <Header title={t.emergency.title} subtitle={t.emergency.subtitle} onBack={() => navigation.goBack()} />

      {/* Call buttons */}
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.md}}>
        {EMERGENCY_CONTACTS.map(c => (
          <Pressable
            key={c.id}
            onPress={() => dial(c.number)}
            style={({pressed}) => ({
              width: '47.5%',
              backgroundColor: c.color,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.lg,
              opacity: pressed ? 0.9 : 1,
              ...theme.shadows.sm,
            })}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Icon name={c.icon} size={24} color="#fff" />
              <Icon name="phone" size={18} color="#fff" />
            </View>
            <AppText variant="bodyStrong" color="#fff" style={{marginTop: theme.spacing.md}}>
              {c.label}
            </AppText>
            <AppText variant="h3" color="#fff">
              {c.number}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* SOS */}
      <Card style={{alignItems: 'center', marginTop: theme.spacing.xl, backgroundColor: active ? theme.colors.dangerSoft : theme.colors.card}}>
        <View style={{height: 200, alignItems: 'center', justifyContent: 'center'}}>
          {!active && (
            <Animated.View
              style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: theme.colors.danger,
                opacity: 0.18,
                transform: [{scale: ring}],
              }}
            />
          )}
          <Pressable
            onPress={countdown !== null || active ? cancelSos : startSos}
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: theme.colors.danger,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.md,
            }}>
            {countdown !== null ? (
              <>
                <AppText variant="display" color="#fff" style={{fontSize: 56}}>
                  {countdown}
                </AppText>
                <AppText variant="caption" color="#fff">
                  {t.emergency.cancel}
                </AppText>
              </>
            ) : active ? (
              <>
                <Icon name="check" size={40} color="#fff" />
                <AppText variant="label" color="#fff" style={{marginTop: 4}}>
                  {t.emergency.cancel}
                </AppText>
              </>
            ) : (
              <>
                <Icon name="alert-triangle" size={40} color="#fff" />
                <AppText variant="h2" color="#fff" style={{marginTop: 4}}>
                  {t.emergency.sos}
                </AppText>
              </>
            )}
          </Pressable>
        </View>
        <AppText variant="caption" muted center style={{maxWidth: 280}}>
          {countdown !== null ? `${t.emergency.sosCountdown} ${countdown}…` : active ? t.emergency.sosActive : t.emergency.sosHint}
        </AppText>
        {active && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.md}}>
            <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.danger}} />
            <AppText variant="label" color={theme.colors.danger}>
              Live location shared with 112 & contacts
            </AppText>
          </View>
        )}
      </Card>

      {/* Nearby help */}
      <SectionHeader title={t.emergency.nearbyHelp} />
      {nearby.map(n => {
        const meta = HELP_META[n.type];
        return (
          <Card key={n.id} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
            <View style={{width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.cardAlt, alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={meta.icon} size={19} color={theme.colors.danger} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="bodyStrong">{n.name}</AppText>
              <AppText variant="caption" muted>
                {t.emergency[meta.labelKey]} · {formatDistance(n.distanceKm)}
              </AppText>
            </View>
            <Pressable
              onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(n.name))}
              style={{padding: theme.spacing.sm}}>
              <Icon name="navigation" size={20} color={theme.colors.secondary} />
            </Pressable>
          </Card>
        );
      })}
    </Screen>
  );
};

export default EmergencyScreen;

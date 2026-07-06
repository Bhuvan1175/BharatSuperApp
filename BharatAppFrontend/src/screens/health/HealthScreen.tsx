import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {healthService} from '../../services/healthService';
import {Pharmacy, GenericAlternative} from '../../types';
import {formatPrice, interpolate} from '../../utils/format';
import {Screen, Header, SearchBar, Card, Button, AppText, Icon, SectionHeader, Badge, FadeInView} from '../../components/common';
import {PharmacyCard} from '../../components/cards';

type Props = NativeStackScreenProps<RootStackParamList, 'Health'>;

const HealthScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {toggleSaved, isSaved} = useAppData();
  const [query, setQuery] = useState(route.params?.medicine ?? 'Dolo 650');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [generic, setGeneric] = useState<GenericAlternative | null>(null);
  const [loading, setLoading] = useState(false);

  const search = (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    Promise.all([healthService.findMedicine(q), healthService.genericFor(q)]).then(([p, g]) => {
      setPharmacies(p);
      setGeneric(g);
      setLoading(false);
    });
  };

  useEffect(() => {
    search(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saved = isSaved('medicines', query);

  return (
    <Screen scroll padded>
      <Header
        title={t.health.title}
        onBack={() => navigation.goBack()}
        right={<Icon name={saved ? 'bookmark' : 'bookmark'} size={20} color={saved ? theme.colors.primary : theme.colors.textMuted} />}
      />
      <View style={{marginTop: theme.spacing.md}}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t.health.searchPlaceholder}
          onSubmit={() => search(query)}
          showAi={false}
        />
      </View>

      {/* Scan prescription CTA */}
      <Card onPress={() => navigation.navigate('PrescriptionScanner')} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: theme.spacing.md}}>
        <View style={{width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.accentSoft, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="camera" size={22} color={theme.colors.accent} />
        </View>
        <View style={{flex: 1}}>
          <AppText variant="bodyStrong">{t.health.scanPrescription}</AppText>
          <AppText variant="caption" muted>
            Snap a prescription — we'll find each medicine nearby.
          </AppText>
        </View>
        <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
      </Card>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{marginTop: theme.spacing.huge}} />
      ) : (
        <>
          {/* Generic alternative + dosage */}
          {generic && (
            <FadeInView>
              <Card style={{marginTop: theme.spacing.lg}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Icon name="zap" size={15} color={theme.colors.primary} />
                    <AppText variant="bodyStrong">{t.health.genericAlt}</AppText>
                  </View>
                  <Badge label={interpolate(t.health.saveMoney, {pct: generic.savingPct})} color={theme.colors.accent} />
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm}}>
                  <AppText variant="body">{generic.name}</AppText>
                  <AppText variant="h3" color={theme.colors.primary}>
                    {formatPrice(generic.price)}
                  </AppText>
                </View>
                <View style={{flexDirection: 'row', gap: 6, marginTop: theme.spacing.md, backgroundColor: theme.colors.cardAlt, padding: theme.spacing.md, borderRadius: theme.radius.sm}}>
                  <Icon name="info" size={14} color={theme.colors.secondary} />
                  <AppText variant="caption" muted style={{flex: 1}}>
                    {t.health.dosage}: {generic.dosageNote}
                  </AppText>
                </View>
                <Button label={t.health.setReminder} icon="bell" variant="outline" size="sm" style={{marginTop: theme.spacing.md}} onPress={() => toggleSaved('medicines', query)} />
              </Card>
            </FadeInView>
          )}

          {/* Pharmacies */}
          <SectionHeader title={t.health.pharmaciesNearby} />
          {pharmacies.map((p, i) => (
            <FadeInView key={p.id} delay={i * 50}>
              <PharmacyCard pharmacy={p} medicine={query} />
            </FadeInView>
          ))}

          {/* Disclaimer */}
          <View style={{flexDirection: 'row', gap: 6, marginTop: theme.spacing.sm, alignItems: 'flex-start'}}>
            <Icon name="alert-circle" size={14} color={theme.colors.textMuted} />
            <AppText variant="caption" muted style={{flex: 1}}>
              {t.health.disclaimer}
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
};

export default HealthScreen;

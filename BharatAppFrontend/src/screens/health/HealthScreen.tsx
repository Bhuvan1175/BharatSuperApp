import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Linking, Alert, Pressable} from 'react-native';
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
import {useMedicines, useMedicineStore, useCreateMedicineRequest} from '../../hooks/useMedicines';
import {Medicine} from '../../api/medicines.api';
import {getApiErrorMessage} from '../../api/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Health'>;

const STOCK_LABEL: Record<string, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

const HealthScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {toggleSaved, isSaved} = useAppData();
  const [query, setQuery] = useState(route.params?.medicine ?? 'Dolo 650');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [generic, setGeneric] = useState<GenericAlternative | null>(null);
  const [loading, setLoading] = useState(false);

  // Real backend: does OUR medicine store actually carry this medicine?
  const {data: storeMatches} = useMedicines({search: query});
  const {data: storeInfo} = useMedicineStore();
  const createRequest = useCreateMedicineRequest();
  const localMatch = (storeMatches ?? []).find((m: Medicine) =>
    m.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const requestPickup = () => {
    if (!localMatch) return;
    Alert.alert('Request this medicine?', `We'll notify the store to prepare 1 ${localMatch.unit} of ${localMatch.name} for pickup.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Request',
        onPress: () =>
          createRequest.mutate(
            {medicineId: localMatch.id, quantity: 1},
            {
              onSuccess: () => Alert.alert('Requested', 'The store has been notified.'),
              onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
            },
          ),
      },
    ]);
  };

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
        right={
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
            <Pressable onPress={() => navigation.navigate('MedicineReminders', undefined)} hitSlop={8}>
              <Icon name="bell" size={20} color={theme.colors.textMuted} />
            </Pressable>
            <Icon name="bookmark" size={20} color={saved ? theme.colors.primary : theme.colors.textMuted} />
          </View>
        }
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

      {/* Our own store — real inventory + pickup location */}
      {localMatch && storeInfo?.address && (
        <FadeInView>
          <Card style={{marginTop: theme.spacing.md, borderColor: theme.colors.primary, borderWidth: 1}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                <Icon name="check-circle" size={15} color={theme.colors.primary} />
                <AppText variant="bodyStrong">Available at your local store</AppText>
              </View>
              <Badge
                label={STOCK_LABEL[localMatch.stockStatus]}
                color={localMatch.stockStatus === 'OUT_OF_STOCK' ? theme.colors.danger : theme.colors.accent}
              />
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm}}>
              <AppText variant="body">
                {localMatch.name}
                {localMatch.strength ? ` (${localMatch.strength})` : ''}
              </AppText>
              <AppText variant="h3" color={theme.colors.primary}>
                {formatPrice(localMatch.price)}
              </AppText>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: theme.spacing.sm}}>
              <Icon name="map-pin" size={13} color={theme.colors.textMuted} />
              <AppText variant="caption" muted style={{flex: 1}}>
                {storeInfo.address}
                {storeInfo.openingHours ? ` · ${storeInfo.openingHours}` : ''}
              </AppText>
            </View>
            <View style={{flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md}}>
              <Button
                label={t.common.directions}
                icon="navigation"
                variant="outline"
                size="sm"
                style={{flex: 1}}
                onPress={() =>
                  Linking.openURL(
                    storeInfo.latitude != null && storeInfo.longitude != null
                      ? `https://maps.google.com/?q=${storeInfo.latitude},${storeInfo.longitude}`
                      : `https://maps.google.com/?q=${encodeURIComponent(storeInfo.address ?? '')}`,
                  )
                }
              />
              <Button
                label="Request pickup"
                icon="shopping-bag"
                size="sm"
                style={{flex: 1}}
                disabled={localMatch.stockStatus === 'OUT_OF_STOCK' || createRequest.isPending}
                loading={createRequest.isPending}
                onPress={requestPickup}
              />
            </View>
          </Card>
        </FadeInView>
      )}

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
                <Button
                  label={t.health.setReminder}
                  icon="bell"
                  variant="outline"
                  size="sm"
                  style={{marginTop: theme.spacing.md}}
                  onPress={() => {
                    toggleSaved('medicines', query);
                    navigation.navigate('MedicineReminders', {medicine: query});
                  }}
                />
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

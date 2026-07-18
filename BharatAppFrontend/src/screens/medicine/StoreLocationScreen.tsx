import React, {useEffect, useState} from 'react';
import {Alert, Pressable, View, ActivityIndicator} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText, Card, Icon} from '@components/common';
import {LoadingState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {useDebounce} from '@hooks/useDebounce';
import {
  useMedicineStore,
  useUpdateMedicineStore,
  usePincodeLookup,
  useGeocodeAddress,
} from '@hooks/useMedicines';
import {PincodeSuggestion} from '../../api/medicines.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Store manager: set the pickup address/contact/hours shown on the Medicine
 * Dashboard and on the citizen-facing medicine page. Backed by the Medicine
 * department's location fields (address/lat/lng/phone/openingHours).
 *
 * Address autocomplete uses data.gov.in's live pincode directory: type a
 * 6-digit PIN, pick a matching locality, and its coordinates (already in
 * that dataset for most offices) fill latitude/longitude automatically. When
 * a picked locality has no coordinates, or the manager edits the address by
 * hand, a free OpenStreetMap Nominatim lookup fills the gap.
 */
const StoreLocationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();

  const {data: store, isLoading} = useMedicineStore();
  const updateStore = useUpdateMedicineStore();
  const geocode = useGeocodeAddress();

  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  const [pincode, setPincode] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedPincode = useDebounce(pincode, 350);
  const {data: suggestions, isFetching: lookingUp} = usePincodeLookup(debouncedPincode);

  useEffect(() => {
    if (!store) return;
    setAddress(store.address ?? '');
    setLatitude(store.latitude != null ? String(store.latitude) : '');
    setLongitude(store.longitude != null ? String(store.longitude) : '');
    setPhone(store.phone ?? '');
    setOpeningHours(store.openingHours ?? '');
  }, [store]);

  const applyGeocodeResult = (label: string) => (result: {latitude: number; longitude: number} | null) => {
    if (result) {
      setLatitude(String(result.latitude));
      setLongitude(String(result.longitude));
    } else {
      Alert.alert('Could not locate address', `We couldn't find coordinates for ${label}. You can still enter them manually.`);
    }
  };

  const pickSuggestion = (s: PincodeSuggestion) => {
    setShowSuggestions(false);
    const locality = `${s.officeName}, ${s.district}, ${s.state} - ${s.pincode}`;
    const nextAddress = address.trim() && !address.includes(s.officeName) ? `${address.trim()}, ${locality}` : locality;
    setAddress(nextAddress);
    setPincode('');

    if (s.latitude != null && s.longitude != null) {
      setLatitude(String(s.latitude));
      setLongitude(String(s.longitude));
    } else {
      // data.gov.in had no coordinates for this office — fall back to a free geocode.
      geocode.mutate(nextAddress, {onSuccess: applyGeocodeResult(s.officeName)});
    }
  };

  const locateFromAddress = () => {
    if (!address.trim()) {
      Alert.alert('Enter an address first', 'Type the pickup address, then tap Locate.');
      return;
    }
    geocode.mutate(address.trim(), {onSuccess: applyGeocodeResult('this address')});
  };

  const onSave = () => {
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter a pickup address.');
      return;
    }
    const lat = latitude.trim() ? Number(latitude) : undefined;
    const lng = longitude.trim() ? Number(longitude) : undefined;
    if (latitude.trim() && Number.isNaN(lat)) {
      Alert.alert('Invalid latitude', 'Latitude must be a number.');
      return;
    }
    if (longitude.trim() && Number.isNaN(lng)) {
      Alert.alert('Invalid longitude', 'Longitude must be a number.');
      return;
    }

    updateStore.mutate(
      {
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        phone: phone.trim() || undefined,
        openingHours: openingHours.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Saved', 'Store location updated.');
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  if (isLoading) {
    return (
      <Screen padded>
        <Header title="Store location" onBack={() => navigation.goBack()} />
        <LoadingState fullscreen={false} />
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <Header title="Store location" onBack={() => navigation.goBack()} />

      <Card style={{flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}>
        <Icon name="info" size={14} color={theme.colors.secondary} />
        <AppText variant="caption" muted style={{flex: 1}}>
          This is the pickup address citizens see on the medicine page, with a Directions button to open maps.
        </AppText>
      </Card>

      <Input
        label="Pickup address"
        icon="map-pin"
        value={address}
        onChangeText={setAddress}
        placeholder="e.g. Shop 4, MG Road, near City Hospital"
        multiline
        containerStyle={{marginBottom: theme.spacing.lg}}
      />

      <View style={{marginBottom: showSuggestions && (suggestions?.length || lookingUp) ? theme.spacing.xs : theme.spacing.lg}}>
        <Input
          label="Pincode (for address suggestions)"
          icon="search"
          value={pincode}
          onChangeText={t => {
            setPincode(t.replace(/[^0-9]/g, '').slice(0, 6));
            setShowSuggestions(true);
          }}
          keyboardType="number-pad"
          placeholder="e.g. 411001"
          maxLength={6}
        />
        <AppText variant="caption" muted style={{marginTop: theme.spacing.xs}}>
          Type your 6-digit PIN — we'll suggest localities from India Post's directory, with coordinates included.
        </AppText>
      </View>

      {showSuggestions && debouncedPincode.length === 6 && (
        <Card style={{marginBottom: theme.spacing.lg, padding: theme.spacing.sm}}>
          {lookingUp ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.sm}}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <AppText variant="caption" muted>
                Looking up localities…
              </AppText>
            </View>
          ) : !suggestions?.length ? (
            <AppText variant="caption" muted style={{padding: theme.spacing.sm}}>
              No localities found for that PIN. You can still type the address manually.
            </AppText>
          ) : (
            suggestions.map((s, i) => (
              <Pressable
                key={`${s.officeName}-${i}`}
                onPress={() => pickSuggestion(s)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.xs,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.border,
                }}>
                <Icon name="map-pin" size={14} color={theme.colors.textMuted} />
                <View style={{flex: 1}}>
                  <AppText variant="body" numberOfLines={1}>
                    {s.officeName}
                  </AppText>
                  <AppText variant="caption" muted numberOfLines={1}>
                    {s.district}, {s.state} — {s.pincode}
                    {s.latitude == null ? ' · no coordinates yet' : ''}
                  </AppText>
                </View>
              </Pressable>
            ))
          )}
        </Card>
      )}

      <Input
        label="Phone (optional)"
        icon="phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="e.g. 98765 43210"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Opening hours (optional)"
        icon="clock"
        value={openingHours}
        onChangeText={setOpeningHours}
        placeholder="e.g. 8:00 AM – 11:00 PM"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />

      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.xs}}>
        <AppText variant="label" muted>
          Coordinates
        </AppText>
        <Pressable onPress={locateFromAddress} disabled={geocode.isPending} style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
          {geocode.isPending ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Icon name="crosshair" size={14} color={theme.colors.primary} />
          )}
          <AppText variant="caption" color={theme.colors.primary}>
            Locate from address
          </AppText>
        </Pressable>
      </View>
      <Input
        label="Latitude"
        icon="map"
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="decimal-pad"
        placeholder="e.g. 19.0760"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Longitude"
        icon="map"
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="decimal-pad"
        placeholder="e.g. 72.8777"
        containerStyle={{marginBottom: theme.spacing.sm}}
      />
      <AppText variant="caption" muted style={{marginBottom: theme.spacing.lg}}>
        Filled automatically when you pick a pincode suggestion, or tap "Locate from address" — you can still adjust them by hand.
      </AppText>

      <Button label="Save location" icon="check" onPress={onSave} loading={updateStore.isPending} disabled={updateStore.isPending} />
    </Screen>
  );
};

export default StoreLocationScreen;

import React, {useEffect, useMemo, useState} from 'react';
import {View, Pressable, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText} from '@components/common';
import OptionPicker from '../../components/admin/OptionPicker';
import {getApiErrorMessage} from '../../api/errors';
import {useAuthStore} from '../../store/authStore';
import {
  useCities,
  useDistricts,
  useLocalities,
  useStates,
} from '../../hooks/useLocations';
import {
  useCreateListing,
  useListing,
  useUpdateListing,
} from '../../hooks/useListings';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'DeptAddListing'>;

const TYPE_OPTIONS = [
  {label: 'Update', value: 'update'},
  {label: 'Alert', value: 'alert'},
];
const STATUS_OPTIONS = [
  {label: 'Active', value: 'active'},
  {label: 'Archived', value: 'archived'},
];

const AddListingScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const listingId = params?.listingId;
  const isEdit = !!listingId;

  const department = useAuthStore(s => s.department);
  const moduleKey = department?.moduleKey ?? '';

  const {data: existing} = useListing(listingId);
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [timing, setTiming] = useState('');
  const [type, setType] = useState('update');
  const [status, setStatus] = useState('active');

  // Location cascade
  const [stateId, setStateId] = useState<string | undefined>();
  const [districtId, setDistrictId] = useState<string | undefined>();
  const [cityId, setCityId] = useState<string | undefined>();
  const [localityId, setLocalityId] = useState<string | undefined>();
  const [locQuery, setLocQuery] = useState('');

  const {data: states} = useStates();
  const {data: districts} = useDistricts(stateId);
  const {data: cities} = useCities(districtId);
  const {data: localities} = useLocalities(cityId);

  // Prefill on edit (location stays as-is unless the user re-picks via cascade).
  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title ?? '');
    setBody(existing.body ?? '');
    setType(existing.type ?? 'update');
    setStatus(existing.status ?? 'active');
    const t = (existing.data as {timing?: string} | null)?.timing;
    if (typeof t === 'string') setTiming(t);
  }, [existing]);

  const stateOptions = useMemo(
    () => (states ?? []).map(s => ({label: s.name, value: s.id})),
    [states],
  );
  const districtOptions = useMemo(
    () => (districts ?? []).map(d => ({label: d.name, value: d.id})),
    [districts],
  );
  const cityOptions = useMemo(
    () => (cities ?? []).map(c => ({label: c.name, value: c.id})),
    [cities],
  );
  const filteredLocalities = useMemo(() => {
    const q = locQuery.trim().toLowerCase();
    const list = localities ?? [];
    return q ? list.filter(l => l.name.toLowerCase().includes(q)) : list;
  }, [localities, locQuery]);

  const busy = createListing.isPending || updateListing.isPending;

  const currentLocationLabel =
    existing?.locality?.name ?? existing?.city?.name ?? 'All areas';

  const onSave = () => {
    if (!moduleKey) {
      Alert.alert('No module', 'Your account is not linked to a department.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title.');
      return;
    }
    const data = timing.trim() ? {timing: timing.trim()} : undefined;

    // Only send a location if the user picked one in the cascade this time.
    const locationPatch: {cityId?: string; localityId?: string} = {};
    if (localityId) {
      locationPatch.localityId = localityId;
    } else if (cityId) {
      locationPatch.cityId = cityId;
    }

    if (isEdit && listingId) {
      updateListing.mutate(
        {
          id: listingId,
          body: {
            title: title.trim(),
            body: body.trim() || undefined,
            type,
            status,
            data,
            ...locationPatch,
          },
        },
        {
          onSuccess: () => {
            Alert.alert('Saved', 'Entry updated.');
            navigation.goBack();
          },
          onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
        },
      );
    } else {
      createListing.mutate(
        {
          moduleKey,
          title: title.trim(),
          body: body.trim() || undefined,
          type,
          status,
          data,
          ...locationPatch,
        },
        {
          onSuccess: () => {
            Alert.alert('Published', 'Entry created.');
            navigation.goBack();
          },
          onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
        },
      );
    }
  };

  return (
    <Screen scroll padded>
      <Header
        title={isEdit ? 'Edit entry' : 'Add entry'}
        onBack={() => navigation.goBack()}
      />

      {isEdit && (
        <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
          Current area: {currentLocationLabel} · pick a new one below to change it
        </AppText>
      )}

      <Input
        label="Title"
        icon="type"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Water supply schedule"
        containerStyle={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Message / details"
        icon="align-left"
        value={body}
        onChangeText={setBody}
        placeholder="e.g. Supply will be available in the morning."
        multiline
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Timing (optional)"
        icon="clock"
        value={timing}
        onChangeText={setTiming}
        placeholder="e.g. 8:00 AM"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />

      <OptionPicker label="Type" value={type} onChange={setType} options={TYPE_OPTIONS} />

      {/* Location cascade: State → District → City → Locality */}
      <OptionPicker
        label="State"
        value={stateId}
        onChange={v => {
          setStateId(v);
          setDistrictId(undefined);
          setCityId(undefined);
          setLocalityId(undefined);
        }}
        options={stateOptions}
      />
      {!stateOptions.length && (
        <AppText variant="caption" muted style={{marginBottom: theme.spacing.md}}>
          No locations yet — add them from "Areas & Settings" on your dashboard.
        </AppText>
      )}

      {!!stateId && (
        <OptionPicker
          label="District"
          value={districtId}
          onChange={v => {
            setDistrictId(v);
            setCityId(undefined);
            setLocalityId(undefined);
          }}
          options={districtOptions}
        />
      )}

      {!!districtId && (
        <OptionPicker
          label="City / town"
          value={cityId}
          onChange={v => {
            setCityId(v);
            setLocalityId(undefined);
            setLocQuery('');
          }}
          options={cityOptions}
        />
      )}

      {/* Locality with type-to-filter (optional — leave empty for city-wide) */}
      {!!cityId && (
        <View style={{marginBottom: theme.spacing.lg}}>
          <AppText variant="label" muted style={{marginBottom: theme.spacing.sm}}>
            Area / locality (optional — leave empty for city-wide)
          </AppText>
          <Input
            icon="search"
            value={locQuery}
            onChangeText={setLocQuery}
            placeholder="Type to find an area…"
            containerStyle={{marginBottom: theme.spacing.sm}}
          />
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm}}>
            {filteredLocalities.map(l => {
              const active = l.id === localityId;
              return (
                <Pressable
                  key={l.id}
                  onPress={() => setLocalityId(active ? undefined : l.id)}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    backgroundColor: active
                      ? theme.colors.primary
                      : theme.colors.cardAlt,
                    borderWidth: 1,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  }}>
                  <AppText
                    variant="label"
                    color={active ? theme.colors.textInverse : theme.colors.text}>
                    {l.name}
                  </AppText>
                </Pressable>
              );
            })}
            {!filteredLocalities.length && (
              <AppText variant="caption" muted>
                {locQuery ? 'No matching area.' : 'No areas — this will be city-wide.'}
              </AppText>
            )}
          </View>
        </View>
      )}

      <OptionPicker label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />

      <Button
        label={isEdit ? 'Save changes' : 'Publish entry'}
        icon="check"
        onPress={onSave}
        loading={busy}
        disabled={busy}
        style={{marginTop: theme.spacing.md}}
      />
    </Screen>
  );
};

export default AddListingScreen;

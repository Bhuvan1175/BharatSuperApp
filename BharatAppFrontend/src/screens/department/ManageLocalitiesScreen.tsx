import React, {useMemo, useState} from 'react';
import {View, Pressable, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {
  Screen,
  Header,
  Card,
  AppText,
  Input,
  Button,
  Icon,
  SectionHeader,
} from '@components/common';
import {getApiErrorMessage} from '../../api/errors';
import {
  useAiStatus,
  useBulkCities,
  useBulkDistricts,
  useBulkLocalities,
  useCities,
  useCreateCity,
  useCreateDistrict,
  useCreateLocality,
  useCreateState,
  useDeleteLocality,
  useDistricts,
  useLocalities,
  useStates,
  useSuggestCities,
  useSuggestDistricts,
  useSuggestLocalities,
} from '../../hooks/useLocations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Item = {id: string; name: string};

/**
 * One reusable "level" of the location cascade: an optional filter box, the
 * existing items (selectable pills or a deletable list), an add-one input, and
 * an optional AI-suggest button with save-all. Powers State, District, City and
 * Locality identically.
 */
const LevelBlock: React.FC<{
  title: string;
  items: Item[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onDelete?: (item: Item) => void;
  addPlaceholder: string;
  onAdd: (name: string) => void;
  adding?: boolean;
  aiEnabled?: boolean;
  onSuggest?: () => void;
  suggesting?: boolean;
  suggestions?: string[];
  onSaveSuggestions?: () => void;
  savingSuggestions?: boolean;
  note?: string;
}> = ({
  title,
  items,
  selectedId,
  onSelect,
  onDelete,
  addPlaceholder,
  onAdd,
  adding,
  aiEnabled,
  onSuggest,
  suggesting,
  suggestions,
  onSaveSuggestions,
  savingSuggestions,
  note,
}) => {
  const {theme} = useTheme();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(i => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const submitAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
  };

  return (
    <View style={{marginTop: theme.spacing.md}}>
      <SectionHeader title={title} />

      {items.length > 6 && (
        <Input
          icon="search"
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${title.toLowerCase()}…`}
          containerStyle={{marginBottom: theme.spacing.md}}
        />
      )}

      {/* Selectable pills */}
      {!!onSelect &&
        (filtered.length ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.md,
            }}>
            {filtered.map(i => {
              const active = i.id === selectedId;
              return (
                <Pressable
                  key={i.id}
                  onPress={() => onSelect(i.id)}
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
                    {i.name}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <AppText variant="caption" muted style={{marginBottom: theme.spacing.md}}>
            {query ? 'No matches.' : 'None yet — add below.'}
          </AppText>
        ))}

      {/* Deletable list (leaf level) */}
      {!!onDelete &&
        (filtered.length ? (
          filtered.map(i => (
            <Card
              key={i.id}
              style={{
                marginBottom: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <AppText variant="body" style={{flex: 1}} numberOfLines={1}>
                {i.name}
              </AppText>
              <Pressable hitSlop={8} onPress={() => onDelete(i)}>
                <Icon name="trash-2" size={18} color={theme.colors.danger} />
              </Pressable>
            </Card>
          ))
        ) : (
          <AppText variant="caption" muted style={{marginBottom: theme.spacing.md}}>
            {query ? 'No matches.' : 'None yet — add below.'}
          </AppText>
        ))}

      {/* Add one */}
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          alignItems: 'flex-end',
        }}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={addPlaceholder}
          containerStyle={{flex: 1}}
        />
        <Button
          label="Add"
          size="sm"
          fullWidth={false}
          onPress={submitAdd}
          loading={adding}
          disabled={adding}
        />
      </View>

      {/* AI suggest (optional) */}
      {aiEnabled && !!onSuggest && (
        <Button
          label={suggesting ? 'Fetching…' : 'Suggest with AI'}
          icon="zap"
          variant="outline"
          size="sm"
          onPress={onSuggest}
          loading={suggesting}
          disabled={suggesting}
          style={{marginTop: theme.spacing.sm}}
        />
      )}
      {!!note && (
        <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
          {note}
        </AppText>
      )}
      {!!suggestions?.length && (
        <Card style={{marginTop: theme.spacing.sm}}>
          <AppText variant="label" muted style={{marginBottom: theme.spacing.sm}}>
            Suggestions — review, then save
          </AppText>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm}}>
            {suggestions.map(s => (
              <View
                key={s}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.pill,
                  backgroundColor: theme.colors.cardAlt,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                <AppText variant="label">{s}</AppText>
              </View>
            ))}
          </View>
          <Button
            label={`Save all (${suggestions.length})`}
            icon="check"
            size="sm"
            onPress={onSaveSuggestions}
            loading={savingSuggestions}
            disabled={savingSuggestions}
            style={{marginTop: theme.spacing.md}}
          />
        </Card>
      )}
    </View>
  );
};

const ManageLocalitiesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {data: aiStatus} = useAiStatus();
  const aiEnabled = !!aiStatus?.enabled;

  const [stateId, setStateId] = useState<string | undefined>();
  const [districtId, setDistrictId] = useState<string | undefined>();
  const [cityId, setCityId] = useState<string | undefined>();

  // suggestion buffers per level
  const [distSug, setDistSug] = useState<string[]>([]);
  const [citySug, setCitySug] = useState<string[]>([]);
  const [locSug, setLocSug] = useState<string[]>([]);
  const [distNote, setDistNote] = useState('');
  const [cityNote, setCityNote] = useState('');
  const [locNote, setLocNote] = useState('');

  const {data: states} = useStates();
  const {data: districts} = useDistricts(stateId);
  const {data: cities} = useCities(districtId);
  const {data: localities} = useLocalities(cityId);

  const createState = useCreateState();
  const createDistrict = useCreateDistrict(stateId ?? '');
  const createCity = useCreateCity(districtId ?? '');
  const createLocality = useCreateLocality(cityId ?? '');

  const bulkDistricts = useBulkDistricts(stateId ?? '');
  const bulkCities = useBulkCities(districtId ?? '');
  const bulkLocalities = useBulkLocalities(cityId ?? '');
  const deleteLocality = useDeleteLocality(cityId);

  const suggestDistricts = useSuggestDistricts();
  const suggestCities = useSuggestCities();
  const suggestLocalities = useSuggestLocalities();

  const fail = (e: unknown) => Alert.alert('Failed', getApiErrorMessage(e));

  return (
    <Screen scroll padded>
      <Header title="Areas & settings" onBack={() => navigation.goBack()} />

      {/* STATE */}
      <LevelBlock
        title="State"
        items={states ?? []}
        selectedId={stateId}
        onSelect={id => {
          setStateId(id);
          setDistrictId(undefined);
          setCityId(undefined);
          setDistSug([]);
          setCitySug([]);
          setLocSug([]);
        }}
        addPlaceholder="Add a state (e.g. Maharashtra)"
        onAdd={name =>
          createState.mutate(name, {onSuccess: s => setStateId(s.id), onError: fail})
        }
        adding={createState.isPending}
      />

      {/* DISTRICT */}
      {!!stateId && (
        <LevelBlock
          title="District"
          items={districts ?? []}
          selectedId={districtId}
          onSelect={id => {
            setDistrictId(id);
            setCityId(undefined);
            setCitySug([]);
            setLocSug([]);
          }}
          addPlaceholder="Add a district (e.g. Nagpur)"
          onAdd={name =>
            createDistrict.mutate(name, {
              onSuccess: d => setDistrictId(d.id),
              onError: fail,
            })
          }
          adding={createDistrict.isPending}
          aiEnabled={aiEnabled}
          onSuggest={() => {
            setDistSug([]);
            setDistNote('');
            suggestDistricts.mutate(stateId, {
              onSuccess: r => {
                setDistSug(r.suggestions);
                if (!r.suggestions.length) setDistNote(r.message);
              },
              onError: fail,
            });
          }}
          suggesting={suggestDistricts.isPending}
          suggestions={distSug}
          onSaveSuggestions={() =>
            bulkDistricts.mutate(distSug, {
              onSuccess: () => setDistSug([]),
              onError: fail,
            })
          }
          savingSuggestions={bulkDistricts.isPending}
          note={distNote}
        />
      )}

      {/* CITY */}
      {!!districtId && (
        <LevelBlock
          title="City / town"
          items={cities ?? []}
          selectedId={cityId}
          onSelect={id => {
            setCityId(id);
            setLocSug([]);
          }}
          addPlaceholder="Add a city / town (e.g. Kalmeshwar)"
          onAdd={name =>
            createCity.mutate(name, {onSuccess: c => setCityId(c.id), onError: fail})
          }
          adding={createCity.isPending}
          aiEnabled={aiEnabled}
          onSuggest={() => {
            setCitySug([]);
            setCityNote('');
            suggestCities.mutate(districtId, {
              onSuccess: r => {
                setCitySug(r.suggestions);
                if (!r.suggestions.length) setCityNote(r.message);
              },
              onError: fail,
            });
          }}
          suggesting={suggestCities.isPending}
          suggestions={citySug}
          onSaveSuggestions={() =>
            bulkCities.mutate(citySug, {
              onSuccess: () => setCitySug([]),
              onError: fail,
            })
          }
          savingSuggestions={bulkCities.isPending}
          note={cityNote}
        />
      )}

      {/* LOCALITY (leaf) */}
      {!!cityId && (
        <LevelBlock
          title="Areas / localities"
          items={localities ?? []}
          onDelete={item =>
            Alert.alert('Delete area?', `Remove "${item.name}"?`, [
              {text: 'Cancel', style: 'cancel'},
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  deleteLocality.mutate(item.id, {onError: fail}),
              },
            ])
          }
          addPlaceholder="Add an area (e.g. Ward 3)"
          onAdd={name =>
            createLocality.mutate(name, {onError: fail})
          }
          adding={createLocality.isPending}
          aiEnabled={aiEnabled}
          onSuggest={() => {
            setLocSug([]);
            setLocNote('');
            suggestLocalities.mutate(cityId, {
              onSuccess: r => {
                setLocSug(r.suggestions);
                if (!r.suggestions.length) setLocNote(r.message);
              },
              onError: fail,
            });
          }}
          suggesting={suggestLocalities.isPending}
          suggestions={locSug}
          onSaveSuggestions={() =>
            bulkLocalities.mutate(locSug, {
              onSuccess: () => setLocSug([]),
              onError: fail,
            })
          }
          savingSuggestions={bulkLocalities.isPending}
          note={locNote}
        />
      )}
    </Screen>
  );
};

export default ManageLocalitiesScreen;

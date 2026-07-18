import React, {useState} from 'react';
import {View, Pressable, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, SearchBar, Card, Button, AppText, Icon, Badge, EmptyState} from '@components/common';
import {LoadingState, ErrorState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {useDeleteMedicine, useMedicines} from '@hooks/useMedicines';
import {Medicine, StockStatus} from '../../api/medicines.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STOCK_LABEL: Record<StockStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

const stockColor = (status: StockStatus, theme: ReturnType<typeof useTheme>['theme']) => {
  if (status === 'OUT_OF_STOCK') return theme.colors.danger;
  if (status === 'LOW_STOCK') return theme.colors.warning;
  return theme.colors.accent;
};

/** Store manager: full inventory — add, edit, remove, and see stock status. */
const MedicineInventoryScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const {data: medicines, isLoading, isError, error, refetch} = useMedicines();
  const deleteMedicine = useDeleteMedicine();

  const filtered = (medicines ?? []).filter(m =>
    m.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const onDelete = (item: Medicine) => {
    Alert.alert('Remove medicine?', `"${item.name}" will be hidden from the catalogue.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          deleteMedicine.mutate(item.id, {
            onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
          }),
      },
    ]);
  };

  const renderItem = (item: Medicine) => (
    <Card key={item.id} style={{marginBottom: theme.spacing.md}}>
      <Pressable
        style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}
        onPress={() => navigation.navigate('AddMedicine', {medicineId: item.id})}>
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {item.name}
            {item.strength ? ` (${item.strength})` : ''}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            ₹{item.price} / {item.unit} · Stock: {item.stockQty}
          </AppText>
          {(item.manufacturer || item.batchNumber || item.expiryDate) && (
            <AppText variant="caption" muted numberOfLines={1}>
              {[
                item.manufacturer,
                item.batchNumber ? `Batch ${item.batchNumber}` : null,
                item.expiryDate ? `Exp ${item.expiryDate.slice(0, 10)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          )}
        </View>
        <Badge label={STOCK_LABEL[item.stockStatus]} color={stockColor(item.stockStatus, theme)} />
        <Pressable onPress={() => onDelete(item)} hitSlop={8}>
          <Icon name="trash-2" size={18} color={theme.colors.danger} />
        </Pressable>
      </Pressable>
    </Card>
  );

  return (
    <Screen scroll padded>
      <Header title="Inventory" onBack={() => navigation.goBack()} />

      <Button
        label="Add medicine"
        icon="plus"
        style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.md}}
        onPress={() => navigation.navigate('AddMedicine')}
      />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search medicines…"
        showAi={false}
        showVoice={false}
      />

      <View style={{marginTop: theme.spacing.lg}}>
        {isLoading ? (
          <LoadingState fullscreen={false} />
        ) : isError ? (
          <ErrorState fullscreen={false} message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        ) : !filtered.length ? (
          <EmptyState
            icon="package"
            title="No medicines yet"
            subtitle="Add your first medicine to start managing stock."
          />
        ) : (
          filtered.map(renderItem)
        )}
      </View>
    </Screen>
  );
};

export default MedicineInventoryScreen;

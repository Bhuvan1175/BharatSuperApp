import React, {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText} from '@components/common';
import DatePickerField from '@components/common/DatePickerField';
import {LoadingState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {
  useCreateMedicine,
  useDeleteMedicine,
  useMedicine,
  useUpdateMedicine,
  useUpdateMedicineStock,
} from '@hooks/useMedicines';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AddMedicine'>;

/** Store manager: add a new medicine, or edit an existing one (incl. stock). */
const AddMedicineScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const medicineId = params?.medicineId;
  const isEdit = !!medicineId;

  const {data: existing, isLoading} = useMedicine(medicineId);
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const updateStock = useUpdateMedicineStock();
  const deleteMedicine = useDeleteMedicine();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strength, setStrength] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState<string | undefined>();
  const [unit, setUnit] = useState('unit');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description ?? '');
    setStrength(existing.strength ?? '');
    setManufacturer(existing.manufacturer ?? '');
    setBatchNumber(existing.batchNumber ?? '');
    setExpiryDate(existing.expiryDate ? existing.expiryDate.slice(0, 10) : undefined);
    setUnit(existing.unit);
    setPrice(String(existing.price));
    setStockQty(String(existing.stockQty));
    setLowStockThreshold(String(existing.lowStockThreshold));
  }, [existing]);

  const busy =
    createMedicine.isPending ||
    updateMedicine.isPending ||
    updateStock.isPending ||
    deleteMedicine.isPending;

  const onSave = () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the medicine name.');
      return;
    }
    const priceNum = Number(price) || 0;
    const thresholdNum = Math.max(0, Math.round(Number(lowStockThreshold) || 0));
    const sharedFields = {
      name: name.trim(),
      description: description.trim() || undefined,
      strength: strength.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate,
      unit: unit.trim() || 'unit',
      price: priceNum,
      lowStockThreshold: thresholdNum,
    };

    if (isEdit && medicineId) {
      updateMedicine.mutate(
        {id: medicineId, body: sharedFields},
        {
          onSuccess: () => {
            const newStock = Math.max(0, Math.round(Number(stockQty) || 0));
            if (existing && newStock !== existing.stockQty) {
              updateStock.mutate(
                {id: medicineId, stockQty: newStock},
                {
                  onSuccess: () => {
                    Alert.alert('Saved', 'Medicine updated.');
                    navigation.goBack();
                  },
                  onError: e => Alert.alert('Stock update failed', getApiErrorMessage(e)),
                },
              );
            } else {
              Alert.alert('Saved', 'Medicine updated.');
              navigation.goBack();
            }
          },
          onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
        },
      );
    } else {
      createMedicine.mutate(
        {
          ...sharedFields,
          stockQty: Math.max(0, Math.round(Number(stockQty) || 0)),
        },
        {
          onSuccess: () => {
            Alert.alert('Added', 'Medicine added to inventory.');
            navigation.goBack();
          },
          onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
        },
      );
    }
  };

  const onDelete = () => {
    if (!medicineId) return;
    Alert.alert('Remove medicine?', `"${name}" will be hidden from the catalogue.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          deleteMedicine.mutate(medicineId, {
            onSuccess: () => navigation.goBack(),
            onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
          }),
      },
    ]);
  };

  if (isEdit && isLoading) {
    return (
      <Screen padded>
        <Header title="Edit medicine" onBack={() => navigation.goBack()} />
        <LoadingState fullscreen={false} />
      </Screen>
    );
  }

  return (
    <Screen scroll padded>
      <Header title={isEdit ? 'Edit medicine' : 'Add medicine'} onBack={() => navigation.goBack()} />

      <Input
        label="Name"
        icon="type"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Dolo 650"
        containerStyle={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Description (optional)"
        icon="align-left"
        value={description}
        onChangeText={setDescription}
        placeholder="e.g. Paracetamol tablet for fever & pain"
        multiline
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Strength (optional)"
        icon="activity"
        value={strength}
        onChangeText={setStrength}
        placeholder="e.g. 250mg, 500mg, 5ml"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Manufacturer (optional)"
        icon="briefcase"
        value={manufacturer}
        onChangeText={setManufacturer}
        placeholder="e.g. Cipla, Sun Pharma"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Batch number (optional)"
        icon="hash"
        value={batchNumber}
        onChangeText={setBatchNumber}
        placeholder="e.g. B24A118"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <DatePickerField
        label="Expiry date (optional)"
        value={expiryDate}
        onChange={setExpiryDate}
        placeholder="Select the pack's expiry date"
      />
      <Input
        label="Unit"
        icon="box"
        value={unit}
        onChangeText={setUnit}
        placeholder="e.g. strip, tablet, bottle"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Price (₹)"
        icon="tag"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="e.g. 32"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Stock quantity"
        icon="package"
        value={stockQty}
        onChangeText={setStockQty}
        keyboardType="number-pad"
        placeholder="e.g. 100"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Low stock alert threshold"
        icon="alert-triangle"
        value={lowStockThreshold}
        onChangeText={setLowStockThreshold}
        keyboardType="number-pad"
        placeholder="e.g. 10"
        containerStyle={{marginBottom: theme.spacing.sm}}
      />
      <AppText variant="caption" muted style={{marginBottom: theme.spacing.lg}}>
        Marked "Low Stock" once quantity falls to or below this number; "Out of Stock" at zero.
      </AppText>

      <Button
        label={isEdit ? 'Save changes' : 'Add medicine'}
        icon="check"
        onPress={onSave}
        loading={busy}
        disabled={busy}
      />

      {isEdit && (
        <Button
          label="Remove medicine"
          icon="trash-2"
          variant="danger"
          onPress={onDelete}
          loading={deleteMedicine.isPending}
          disabled={busy}
          style={{marginTop: theme.spacing.md}}
        />
      )}
    </Screen>
  );
};

export default AddMedicineScreen;

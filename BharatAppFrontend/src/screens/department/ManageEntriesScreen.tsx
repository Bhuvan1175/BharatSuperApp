import React from 'react';
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
  Icon,
  Button,
  EmptyState,
} from '@components/common';
import {getApiErrorMessage} from '../../api/errors';
import {useAuthStore} from '../../store/authStore';
import {useDeleteListing, useListings} from '../../hooks/useListings';
import {Listing} from '../../api/listings.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const StatusBadge: React.FC<{status: string}> = ({status}) => {
  const {theme} = useTheme();
  const active = status === 'active';
  const bg = active ? theme.colors.accentSoft : theme.colors.cardAlt;
  const fg = active ? theme.colors.accent : theme.colors.textMuted;
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: bg,
      }}>
      <AppText variant="caption" color={fg}>
        {status}
      </AppText>
    </View>
  );
};

const ManageEntriesScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const department = useAuthStore(s => s.department);
  const moduleKey = department?.moduleKey;

  const {data: listings, isLoading} = useListings(
    moduleKey ? {moduleKey} : undefined,
  );
  const deleteListing = useDeleteListing();

  const onDelete = (item: Listing) => {
    Alert.alert('Delete entry?', `"${item.title}" will be permanently removed.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteListing.mutate(item.id, {
            onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
          }),
      },
    ]);
  };

  const renderItem = (item: Listing) => (
    <Card
      key={item.id}
      style={{
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}>
      <Pressable
        style={{flex: 1}}
        onPress={() =>
          navigation.navigate('DeptAddListing', {listingId: item.id})
        }>
        <AppText variant="title" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {item.locality?.name ?? item.city?.name ?? 'All areas'} · {item.type}
        </AppText>
      </Pressable>
      <StatusBadge status={item.status} />
      <Pressable onPress={() => onDelete(item)} hitSlop={8}>
        <Icon name="trash-2" size={18} color={theme.colors.danger} />
      </Pressable>
    </Card>
  );

  return (
    <Screen scroll padded>
      <Header title="Manage entries" onBack={() => navigation.goBack()} />

      <Button
        label="Add entry"
        icon="plus"
        style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
        onPress={() => navigation.navigate('DeptAddListing')}
      />

      {isLoading ? (
        <AppText variant="body" muted center style={{marginTop: theme.spacing.xl}}>
          Loading…
        </AppText>
      ) : !listings?.length ? (
        <EmptyState
          icon="inbox"
          title="No entries yet"
          subtitle="Add your first entry to get started."
        />
      ) : (
        listings.map(renderItem)
      )}
    </Screen>
  );
};

export default ManageEntriesScreen;

import React, {useState} from 'react';
import {View, FlatList, ActivityIndicator, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {AppText, Avatar, Header, SearchBar, EmptyState} from '../../components/common';
import {useDebounce} from '../../hooks/useDebounce';
import {useUserSearch} from '../../hooks/useUserSearch';

type Props = NativeStackScreenProps<RootStackParamList, 'UserSearch'>;

const UserSearchScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 400);
  const trimmed = debounced.trim();
  const showResults = trimmed.length >= 1;

  const {data, isLoading, isError, isFetching, refetch} =
    useUserSearch(debounced);

  const renderBody = () => {
    if (!showResults) {
      return (
        <EmptyState
          icon="search"
          title="Search people"
          subtitle="Find users by their name or username."
        />
      );
    }
    if (isLoading) {
      return (
        <View style={{paddingVertical: theme.spacing.xxxl}}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={{alignItems: 'center'}}>
          <EmptyState
            icon="alert-circle"
            title="Something went wrong"
            subtitle="Could not load results. Please try again."
          />
          <Pressable onPress={() => refetch()} hitSlop={8}>
            <AppText variant="label" color={theme.colors.primary}>
              Tap to retry
            </AppText>
          </Pressable>
        </View>
      );
    }
    if (!data || data.length === 0) {
      return (
        <EmptyState
          icon="user-x"
          title="No users found"
          subtitle={`No results for "${trimmed}".`}
        />
      );
    }
    return (
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.giant,
        }}
        renderItem={({item}) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
              paddingVertical: theme.spacing.md,
            }}>
            <Avatar
              name={item.name || item.username || 'User'}
              uri={item.profileImage || undefined}
              size={46}
            />
            <View style={{flex: 1}}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {item.name || 'Unnamed'}
              </AppText>
              {!!item.username && (
                <AppText variant="caption" muted numberOfLines={1}>
                  @{item.username}
                </AppText>
              )}
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg}}>
        <Header title="Find people" onBack={() => navigation.goBack()} />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or username"
          showAi={false}
          showVoice={false}
          autoFocus
          style={{marginTop: theme.spacing.md}}
        />
        {/* Subtle indicator while re-querying with previous results shown. */}
        {showResults && isFetching && !isLoading && (
          <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
            Searching…
          </AppText>
        )}
      </View>
      <View style={{flex: 1, marginTop: theme.spacing.md}}>{renderBody()}</View>
    </SafeAreaView>
  );
};

export default UserSearchScreen;

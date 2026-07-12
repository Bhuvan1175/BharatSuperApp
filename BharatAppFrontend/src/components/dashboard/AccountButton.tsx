import React from 'react';
import {Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useAuthStore} from '@/store/authStore';
import {Avatar} from '@components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * AccountButton — the avatar in a dashboard header that opens the Account
 * screen (edit profile · settings/dark mode · logout). Gives department
 * managers and the super admin the same account access citizens get from the
 * Profile tab.
 */
const AccountButton: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  return (
    <Pressable onPress={() => navigation.navigate('Account')} hitSlop={8}>
      <Avatar
        name={user?.name || user?.email || 'User'}
        uri={user?.profileImage || undefined}
        size={42}
      />
    </Pressable>
  );
};

export default AccountButton;

import React from 'react';
import {View, Image} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
}

const initials = (name: string): string =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

const Avatar: React.FC<AvatarProps> = ({name, uri, size = 48}) => {
  const {theme} = useTheme();
  if (uri) {
    return <Image source={{uri}} style={{width: size, height: size, borderRadius: size / 2}} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <AppText variant="title" color={theme.colors.primary} style={{fontSize: size * 0.36}}>
        {initials(name)}
      </AppText>
    </View>
  );
};

export default Avatar;

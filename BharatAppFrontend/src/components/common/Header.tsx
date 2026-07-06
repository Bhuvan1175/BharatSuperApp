import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
}

/** Lightweight screen header with optional back button and right slot. */
const Header: React.FC<HeaderProps> = ({title, onBack, right, subtitle}) => {
  const {theme} = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 48,
      }}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="arrow-left" size={24} />
        </Pressable>
      )}
      <View style={{flex: 1}}>
        {title && (
          <AppText variant="h3" numberOfLines={1}>
            {title}
          </AppText>
        )}
        {subtitle && (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
};

export default Header;

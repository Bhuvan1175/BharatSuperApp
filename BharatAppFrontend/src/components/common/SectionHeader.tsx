import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({title, actionLabel, onAction}) => {
  const {theme} = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.sm,
      }}>
      <AppText variant="h3" numberOfLines={1} style={{flexShrink: 1, marginRight: theme.spacing.md}}>
        {title}
      </AppText>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8} style={{flexShrink: 0}}>
          <AppText variant="label" color={theme.colors.secondary} numberOfLines={1}>
            {actionLabel}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

export default SectionHeader;

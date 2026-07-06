import React from 'react';
import {Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from '../common/AppText';
import Icon from '../common/Icon';

/** Suggestion chip in the AI Chat empty state. */
const SuggestionChip: React.FC<{label: string; onPress: () => void}> = ({label, onPress}) => {
  const {theme} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}>
      <Icon name="message-circle" size={16} color={theme.colors.primary} />
      <AppText variant="body" style={{flex: 1}}>
        {label}
      </AppText>
      <Icon name="arrow-up-right" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
};

export default SuggestionChip;

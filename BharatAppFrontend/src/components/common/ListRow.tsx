import React from 'react';
import {Pressable, View, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface ListRowProps {
  icon?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Generic settings/list row. */
const ListRow: React.FC<ListRowProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  onPress,
  showChevron,
  style,
}) => {
  const {theme} = useTheme();
  const content = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          minHeight: 52,
        },
        style,
      ]}>
      {icon && (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.cardAlt,
          }}>
          <Icon name={icon} size={18} color={iconColor ?? theme.colors.text} />
        </View>
      )}
      <View style={{flex: 1}}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="caption" muted numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
      {showChevron && <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
        {content}
      </Pressable>
    );
  }
  return content;
};

export default ListRow;

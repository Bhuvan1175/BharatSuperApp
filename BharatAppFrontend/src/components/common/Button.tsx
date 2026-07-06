import React from 'react';
import {Pressable, ActivityIndicator, View, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {MIN_TOUCH} from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth = true,
  style,
}) => {
  const {theme} = useTheme();
  const heights: Record<Size, number> = {sm: 40, md: 50, lg: 56};
  const height = Math.max(heights[size], MIN_TOUCH);

  const bg: Record<Variant, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: theme.colors.danger,
  };
  const fg: Record<Variant, string> = {
    primary: theme.colors.textInverse,
    secondary: theme.colors.textInverse,
    outline: theme.colors.primary,
    ghost: theme.colors.text,
    danger: theme.colors.textInverse,
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled: isDisabled, busy: loading}}
      onPress={onPress}
      disabled={isDisabled}
      style={({pressed}) => [
        {
          height,
          borderRadius: theme.radius.md,
          backgroundColor: bg[variant],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.xl,
          gap: theme.spacing.sm,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: theme.colors.primary,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.55 : pressed ? 0.88 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} color={fg[variant]} />}
          <AppText
            variant={size === 'sm' ? 'label' : 'bodyStrong'}
            color={fg[variant]}
            numberOfLines={1}
            style={{flexShrink: 1, textAlign: 'center'}}>
            {label}
          </AppText>
          {iconRight && <Icon name={iconRight} size={18} color={fg[variant]} />}
        </>
      )}
    </Pressable>
  );
};

export default Button;

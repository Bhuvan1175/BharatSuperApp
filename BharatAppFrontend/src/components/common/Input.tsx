import React, {useState} from 'react';
import {View, TextInput, TextInputProps, Pressable, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {MIN_TOUCH} from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input: React.FC<InputProps> = ({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  containerStyle,
  style,
  ...rest
}) => {
  const {theme} = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && (
        <AppText variant="label" muted style={{marginBottom: theme.spacing.xs}}>
          {label}
        </AppText>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: MIN_TOUCH + 6,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: error
            ? theme.colors.danger
            : focused
            ? theme.colors.primary
            : theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        }}>
        {icon && <Icon name={icon} size={18} color={theme.colors.textMuted} />}
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            {
              flex: 1,
              color: theme.colors.text,
              fontFamily: theme.fontFamily.regular,
              fontSize: 15,
              paddingVertical: theme.spacing.md,
            },
            style,
          ]}
          {...rest}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <Icon name={rightIcon} size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error && (
        <AppText variant="caption" color={theme.colors.danger} style={{marginTop: theme.spacing.xs}}>
          {error}
        </AppText>
      )}
    </View>
  );
};

export default Input;

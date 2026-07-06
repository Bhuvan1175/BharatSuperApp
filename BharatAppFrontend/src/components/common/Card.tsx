import React from 'react';
import {View, Pressable, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  padded?: boolean;
}

/** Surface container with theme-aware background, border and optional shadow. */
const Card: React.FC<CardProps> = ({children, onPress, style, elevated = true, padded = true}) => {
  const {theme} = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: padded ? theme.spacing.lg : 0,
    ...(elevated ? theme.shadows.sm : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [base, pressed && {opacity: 0.9, transform: [{scale: 0.995}]}, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
};

export default Card;

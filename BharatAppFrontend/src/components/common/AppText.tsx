import React from 'react';
import {Text, TextProps, TextStyle, StyleProp} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {typography} from '../../theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  muted?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

/** Themed text primitive — always use instead of raw <Text>. */
const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  center,
  muted,
  style,
  children,
  ...rest
}) => {
  const {theme} = useTheme();
  return (
    <Text
      allowFontScaling
      style={[
        typography[variant],
        {color: color ?? (muted ? theme.colors.textMuted : theme.colors.text)},
        center && {textAlign: 'center'},
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
};

export default AppText;

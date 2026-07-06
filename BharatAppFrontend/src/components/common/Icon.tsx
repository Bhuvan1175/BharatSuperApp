import React from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {useTheme} from '../../context/ThemeContext';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * App icon — Feather set (clean 2px line icons, rounded caps) matching the
 * design system. Defaults to the theme's primary text colour.
 */
const Icon: React.FC<IconProps> = ({name, size = 22, color, style}) => {
  const {theme} = useTheme();
  return <Feather name={name} size={size} color={color ?? theme.colors.text} style={style} />;
};

export default Icon;

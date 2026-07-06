import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';

const Divider: React.FC<{spacing?: number}> = ({spacing}) => {
  const {theme} = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: spacing ?? theme.spacing.md,
      }}
    />
  );
};

export default Divider;

import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({icon = 'inbox', title, subtitle}) => {
  const {theme} = useTheme();
  return (
    <View style={{alignItems: 'center', paddingVertical: theme.spacing.xxxl, gap: theme.spacing.sm}}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.cardAlt,
        }}>
        <Icon name={icon} size={28} color={theme.colors.textMuted} />
      </View>
      <AppText variant="title" center>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="body" muted center style={{maxWidth: 260}}>
          {subtitle}
        </AppText>
      )}
    </View>
  );
};

export default EmptyState;

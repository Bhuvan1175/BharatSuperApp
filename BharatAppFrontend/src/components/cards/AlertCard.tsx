import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {LocalAlert} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';

const ICONS: Record<LocalAlert['type'], string> = {power: 'zap', water: 'droplet', traffic: 'navigation'};

const AlertCard: React.FC<{alert: LocalAlert; onPress?: () => void}> = ({alert, onPress}) => {
  const {theme} = useTheme();
  const sevColor =
    alert.severity === 'high'
      ? theme.colors.danger
      : alert.severity === 'medium'
      ? theme.colors.warning
      : theme.colors.secondary;

  return (
    <Card onPress={onPress} style={{width: 260, marginRight: theme.spacing.md}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 6}}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: withAlpha(sevColor),
          }}>
          <Icon name={ICONS[alert.type]} size={17} color={sevColor} />
        </View>
        <View style={{flex: 1}}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {alert.title}
          </AppText>
          <AppText variant="caption" color={sevColor}>
            {alert.window.from} – {alert.window.to}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" muted numberOfLines={2}>
        {alert.message}
      </AppText>
    </Card>
  );
};

const withAlpha = (hex: string): string => {
  if (!hex.startsWith('#') || hex.length !== 7) return 'rgba(0,0,0,0.1)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.14)`;
};

export default AlertCard;

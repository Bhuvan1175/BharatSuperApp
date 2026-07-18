import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {MODULES} from '../../rbac';
import {Listing} from '../../api/listings.api';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import {formatDate} from '../common/DatePickerField';

type ModuleMeta = {label: string; icon: string; color: string};

/**
 * Renders a single live backend alert (a Listing of type "alert") for the
 * citizen Home feed. Uses the department's own label/icon/colour from the RBAC
 * MODULES registry, so Water, Electricity, etc. each look consistent with the
 * rest of the app. Shows the area (ward → locality → city) and optional timing.
 */
const ModuleAlertCard: React.FC<{
  alert: Listing;
  onPress?: () => void;
  /** Full-width for a vertical list; otherwise a fixed 260px horizontal card. */
  fullWidth?: boolean;
}> = ({alert, onPress, fullWidth}) => {
  const {theme} = useTheme();
  const mod = (MODULES as Record<string, ModuleMeta>)[alert.moduleKey];
  const color = mod?.color ?? theme.colors.primary;
  const icon = mod?.icon ?? 'bell';
  const dept = mod?.label ?? alert.moduleKey;

  const area = alert.ward
    ? `Ward ${alert.ward.number} — ${alert.ward.name}`
    : alert.locality?.name ?? alert.city?.name ?? 'All areas';
  const extras = alert.data as {timing?: string; date?: string} | null;
  const timing = extras?.timing;
  const applyDate = formatDate(extras?.date);

  return (
    <Card
      onPress={onPress}
      style={
        fullWidth
          ? {width: '100%', marginBottom: theme.spacing.md}
          : {width: 260, marginRight: theme.spacing.md}
      }>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: 6,
        }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: withAlpha(color),
          }}>
          <Icon name={icon} size={17} color={color} />
        </View>
        <View style={{flex: 1}}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {alert.title}
          </AppText>
          <AppText variant="caption" color={color} numberOfLines={1}>
            {dept} · {area}
          </AppText>
        </View>
      </View>

      {!!alert.body && (
        <AppText variant="caption" muted numberOfLines={2}>
          {alert.body}
        </AppText>
      )}

      {(!!applyDate || !!timing) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
            marginTop: 6,
          }}>
          {!!applyDate && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Icon name="calendar" size={12} color={color} />
              <AppText variant="caption" color={color} numberOfLines={1}>
                {applyDate}
              </AppText>
            </View>
          )}
          {!!timing && (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Icon name="clock" size={12} color={theme.colors.textMuted} />
              <AppText variant="caption" muted numberOfLines={1}>
                {timing}
              </AppText>
            </View>
          )}
        </View>
      )}
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

export default ModuleAlertCard;

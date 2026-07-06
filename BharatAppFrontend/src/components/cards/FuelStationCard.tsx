import React from 'react';
import {View, Linking} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {FuelStation} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import Button from '../common/Button';
import {formatDistance} from '../../utils/format';
import {crowdColor, crowdLabelKey} from '../../utils/helpers';
import {useTranslation} from '../../hooks/useTranslation';

const FuelStationCard: React.FC<{station: FuelStation}> = ({station}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const cColor = crowdColor(station.crowdLevel);
  const cLabel = t.travel[crowdLabelKey(station.crowdLevel)];

  return (
    <Card style={{marginBottom: theme.spacing.md}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{flex: 1, paddingRight: theme.spacing.sm}}>
          <AppText variant="title" numberOfLines={2}>{station.name}</AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {station.brand}
          </AppText>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: 6}}>
            <Meta icon="map-pin" text={formatDistance(station.distanceKm)} />
            <Meta icon="star" text={station.rating.toFixed(1)} color={theme.colors.warning} />
          </View>
        </View>
        <View style={{alignItems: 'flex-end', justifyContent: 'space-between'}}>
          <AppText variant="h3" color={theme.colors.primary}>
            ₹{station.price}
            <AppText variant="caption" muted>
              {station.fuelTypes.includes('EV') ? '/kWh' : t.travel.perLitre}
            </AppText>
          </AppText>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6}}>
            <View style={{width: 9, height: 9, borderRadius: 5, backgroundColor: cColor}} />
            <AppText variant="caption" color={cColor} style={{fontWeight: '700'}}>
              {cLabel}
            </AppText>
          </View>
        </View>
      </View>
      <Button
        label={t.common.directions}
        icon="navigation"
        variant="outline"
        size="sm"
        style={{marginTop: theme.spacing.md}}
        onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(station.name))}
      />
    </Card>
  );
};

const Meta: React.FC<{icon: string; text: string; color?: string}> = ({icon, text, color}) => {
  const {theme} = useTheme();
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
      <Icon name={icon} size={13} color={color ?? theme.colors.textMuted} />
      <AppText variant="caption" muted>
        {text}
      </AppText>
    </View>
  );
};

export default FuelStationCard;

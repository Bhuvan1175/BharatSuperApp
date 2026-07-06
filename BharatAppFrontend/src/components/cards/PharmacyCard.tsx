import React from 'react';
import {View, Linking} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Pharmacy} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import Button from '../common/Button';
import {formatDistance, formatPrice} from '../../utils/format';
import {useTranslation} from '../../hooks/useTranslation';

const PharmacyCard: React.FC<{pharmacy: Pharmacy; medicine?: string}> = ({pharmacy, medicine}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const item = medicine
    ? pharmacy.stock.find(s => s.medicine.toLowerCase().includes(medicine.toLowerCase()))
    : pharmacy.stock[0];
  const available = item?.available ?? false;

  return (
    <Card style={{marginBottom: theme.spacing.md}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <View style={{flex: 1, paddingRight: theme.spacing.sm}}>
          <AppText variant="title" numberOfLines={2}>{pharmacy.name}</AppText>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginTop: 4}}>
            <Row icon="map-pin" text={formatDistance(pharmacy.distanceKm)} />
            <Row icon="star" text={pharmacy.rating.toFixed(1)} color={theme.colors.warning} />
          </View>
          <Row icon="clock" text={pharmacy.hours} style={{marginTop: 4}} />
        </View>
        {item && (
          <View style={{alignItems: 'flex-end'}}>
            <AppText variant="h3" color={theme.colors.primary}>
              {formatPrice(item.price)}
            </AppText>
            <Badge
              label={available ? t.health.inStock : t.health.outOfStock}
              color={available ? theme.colors.accent : theme.colors.danger}
              icon={available ? 'check' : 'x'}
            />
          </View>
        )}
      </View>
      <Button
        label={t.common.directions}
        icon="navigation"
        variant="outline"
        size="sm"
        style={{marginTop: theme.spacing.md}}
        onPress={() => Linking.openURL('https://maps.google.com/?q=' + encodeURIComponent(pharmacy.name))}
      />
    </Card>
  );
};

const Row: React.FC<{icon: string; text: string; color?: string; style?: object}> = ({icon, text, color, style}) => {
  const {theme} = useTheme();
  return (
    <View style={[{flexDirection: 'row', alignItems: 'center', gap: 4}, style]}>
      <Icon name={icon} size={13} color={color ?? theme.colors.textMuted} />
      <AppText variant="caption" muted>
        {text}
      </AppText>
    </View>
  );
};

export default PharmacyCard;

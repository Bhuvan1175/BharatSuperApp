import React from 'react';
import {View, Linking} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Scheme} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Badge from '../common/Badge';
import Icon from '../common/Icon';
import Button from '../common/Button';
import {eligibilityColor} from '../../utils/helpers';
import {useTranslation} from '../../hooks/useTranslation';

const SchemeCard: React.FC<{scheme: Scheme; onSave?: () => void; saved?: boolean}> = ({
  scheme,
  onSave,
  saved,
}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const statusColor = eligibilityColor(scheme.eligibilityStatus);
  const statusLabel =
    scheme.eligibilityStatus === 'eligible'
      ? t.government.eligible
      : scheme.eligibilityStatus === 'maybe'
      ? t.government.maybe
      : t.government.ineligible;

  return (
    <Card style={{marginBottom: theme.spacing.md}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <View style={{flex: 1, paddingRight: theme.spacing.sm}}>
          <AppText variant="title" numberOfLines={2}>{scheme.name}</AppText>
          <Badge label={scheme.category} color={theme.colors.secondary} />
        </View>
        {onSave && (
          <Icon
            name={saved ? 'bookmark' : 'bookmark'}
            size={20}
            color={saved ? theme.colors.primary : theme.colors.textMuted}
          />
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: theme.spacing.sm,
          backgroundColor: theme.colors.accentSoft,
          padding: theme.spacing.sm,
          borderRadius: theme.radius.sm,
        }}>
        <Icon name="gift" size={15} color={theme.colors.accent} />
        <AppText variant="label" color={theme.colors.text} style={{flex: 1}}>
          {scheme.benefit}
        </AppText>
      </View>

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: theme.spacing.md}}>
        <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor}} />
        <AppText variant="label" color={statusColor}>
          {statusLabel}
        </AppText>
      </View>

      <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
        {t.government.requiredDocs}: {scheme.requiredDocs.join(', ')}
      </AppText>

      <Button
        label={t.common.apply}
        icon="external-link"
        size="sm"
        style={{marginTop: theme.spacing.md}}
        onPress={() => Linking.openURL(scheme.applyUrl)}
      />
    </Card>
  );
};

export default SchemeCard;

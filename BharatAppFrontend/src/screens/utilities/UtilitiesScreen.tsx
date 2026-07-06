import React, {useEffect, useState} from 'react';
import {View, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {alertsService} from '../../services/alertsService';
import {UtilityRow} from '../../data/utilities';
import {Screen, Header, Card, Button, AppText, Icon, SectionHeader, Badge, FadeInView} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Utilities'>;

const UtilitiesScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [rows, setRows] = useState<UtilityRow[]>([]);

  useEffect(() => {
    alertsService.utilities().then(setRows);
  }, []);

  const power = rows.filter(r => r.kind === 'power');
  const water = rows.filter(r => r.kind === 'water');

  const renderRow = (r: UtilityRow, i: number) => {
    const color = r.kind === 'power' ? theme.colors.warning : theme.colors.secondary;
    return (
      <FadeInView key={r.id} delay={i * 50}>
        <Card style={{marginBottom: theme.spacing.sm}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
            <View style={{width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.cardAlt, alignItems: 'center', justifyContent: 'center'}}>
              <Icon name={r.kind === 'power' ? 'zap' : 'droplet'} size={19} color={color} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="bodyStrong">{r.area}</AppText>
              <AppText variant="caption" muted>
                {r.window}
              </AppText>
            </View>
            <Badge
              label={r.status === 'scheduled' ? t.utilities.scheduled : t.utilities.reported}
              color={r.status === 'scheduled' ? theme.colors.secondary : theme.colors.warning}
            />
          </View>
          <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
            {r.note}
          </AppText>
        </Card>
      </FadeInView>
    );
  };

  return (
    <Screen scroll padded>
      <Header title={t.utilities.title} onBack={() => navigation.goBack()} />

      <SectionHeader title={t.utilities.power} />
      {power.map(renderRow)}

      <SectionHeader title={t.utilities.water} />
      {water.map(renderRow)}

      <Button
        label={t.utilities.bookTanker}
        icon="truck"
        variant="secondary"
        style={{marginTop: theme.spacing.lg}}
        onPress={() => Alert.alert(t.utilities.bookTanker, 'A water tanker booking request has been placed (demo).')}
      />
    </Screen>
  );
};

export default UtilitiesScreen;

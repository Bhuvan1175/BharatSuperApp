import React from 'react';
import {View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, AppText, Button, Icon} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

const PermissionsScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();

  const proceed = () => navigation.replace('Main');

  return (
    <Screen>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.colors.secondarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.xxl,
          }}>
          <Icon name="map-pin" size={54} color={theme.colors.secondary} />
        </View>
        <AppText variant="h1" center>
          {t.auth.permTitle}
        </AppText>
        <AppText variant="body" muted center style={{marginTop: theme.spacing.md, maxWidth: 320}}>
          {t.auth.permSubtitle}
        </AppText>

        <View style={{marginTop: theme.spacing.xxl, gap: theme.spacing.md, alignSelf: 'stretch'}}>
          {[
            {icon: 'shield', text: 'Used only to power near-me answers'},
            {icon: 'lock', text: 'Never shared without your consent (DPDP-compliant)'},
            {icon: 'sliders', text: 'You stay in control — change it anytime in Settings'},
          ].map(row => (
            <View key={row.icon} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
              <Icon name={row.icon} size={18} color={theme.colors.accent} />
              <AppText variant="body" style={{flex: 1}}>
                {row.text}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={{gap: theme.spacing.md}}>
        <Button label={t.auth.allowLocation} icon="navigation" onPress={proceed} />
        <Button label={t.auth.enterManually} variant="ghost" onPress={proceed} />
      </View>
    </Screen>
  );
};

export default PermissionsScreen;

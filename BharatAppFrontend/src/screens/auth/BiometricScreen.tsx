import React from 'react';
import {View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, AppText, Button, Icon} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Biometric'>;

/**
 * Biometric unlock (E1-S3). In production, integrate react-native-biometrics or
 * expo-local-authentication; here it simulates the prompt and falls back to OTP.
 */
const BiometricScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();

  return (
    <Screen>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.xxl,
          }}>
          <Icon name="unlock" size={54} color={theme.colors.primary} />
        </View>
        <AppText variant="h1" center>
          {t.auth.biometricTitle}
        </AppText>
        <AppText variant="body" muted center style={{marginTop: theme.spacing.md, maxWidth: 300}}>
          {t.auth.biometricSubtitle}
        </AppText>
      </View>
      <View style={{gap: theme.spacing.md}}>
        <Button label={t.auth.useBiometric} icon="unlock" onPress={() => navigation.replace('Main')} />
        <Button label={t.auth.useOtpInstead} variant="ghost" onPress={() => navigation.replace('Login')} />
      </View>
    </Screen>
  );
};

export default BiometricScreen;

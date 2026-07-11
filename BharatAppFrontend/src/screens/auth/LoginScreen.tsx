import React, {useState} from 'react';
import {View, KeyboardAvoidingView, Platform} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, AppText, Button, Input, Icon} from '../../components/common';
import {authApi} from '../../api/auth.api';
import {getApiErrorMessage} from '../../api/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  // Basic email format check (final validation happens on the backend via @IsEmail()).
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSend = async () => {
    if (!valid) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await authApi.sendOtp(cleanEmail);
      navigation.navigate('Otp', {email: cleanEmail});
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.xl,
            }}>
            <Icon name="mail" size={30} color={theme.colors.textInverse} />
          </View>
          <AppText variant="h1">{t.auth.loginTitle}</AppText>
          <AppText variant="body" muted style={{marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxl}}>
            {t.auth.loginSubtitle}
          </AppText>

          <Input
            placeholder={t.auth.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={txt => setEmail(txt)}
            error={error}
            icon="mail"
          />

          <Button
            label={t.auth.sendOtp}
            onPress={onSend}
            iconRight="arrow-right"
            style={{marginTop: theme.spacing.xl}}
            disabled={!valid || loading}
            loading={loading}
          />

          <AppText variant="caption" muted center style={{marginTop: theme.spacing.xxl}}>
            By continuing you agree to our Terms & Privacy Policy. Your data is protected per India's DPDP Act.
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default LoginScreen;

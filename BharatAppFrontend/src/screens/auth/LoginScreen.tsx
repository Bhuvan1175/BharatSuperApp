import React, {useState} from 'react';
import {View, KeyboardAvoidingView, Platform} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, AppText, Button, Input, Icon} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | undefined>();

  const valid = /^[6-9]\d{9}$/.test(phone);

  const onSend = () => {
    if (!valid) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError(undefined);
    navigation.navigate('Otp', {phone});
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
            <Icon name="smartphone" size={30} color={theme.colors.textInverse} />
          </View>
          <AppText variant="h1">{t.auth.loginTitle}</AppText>
          <AppText variant="body" muted style={{marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxl}}>
            {t.auth.loginSubtitle}
          </AppText>

          <View style={{flexDirection: 'row', gap: theme.spacing.md, alignItems: 'flex-start'}}>
            <View
              style={{
                height: 50,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <AppText variant="bodyStrong">🇮🇳 +91</AppText>
            </View>
            <Input
              containerStyle={{flex: 1}}
              placeholder={t.auth.phonePlaceholder}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={txt => setPhone(txt.replace(/[^0-9]/g, ''))}
              error={error}
              icon="phone"
            />
          </View>

          <Button label={t.auth.sendOtp} onPress={onSend} iconRight="arrow-right" style={{marginTop: theme.spacing.xl}} disabled={!valid} />

          <AppText variant="caption" muted center style={{marginTop: theme.spacing.xxl}}>
            By continuing you agree to our Terms & Privacy Policy. Your data is protected per India's DPDP Act.
          </AppText>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default LoginScreen;

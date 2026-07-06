import React, {useEffect, useRef, useState} from 'react';
import {View, TextInput, Pressable, KeyboardAvoidingView, Platform} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../hooks/useTranslation';
import {useCountdown} from '../../hooks/useCountdown';
import {APP_CONFIG} from '../../constants/config';
import {Screen, AppText, Button, Header} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

const OtpScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {signIn} = useAuth();
  const {phone} = route.params;
  const len = APP_CONFIG.otpLength;
  const [digits, setDigits] = useState<string[]>(Array(len).fill(''));
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const inputs = useRef<(TextInput | null)[]>([]);
  const {remaining, running, start} = useCountdown(APP_CONFIG.otpResendSeconds);

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const code = digits.join('');
  const complete = code.length === len;

  const onChange = (val: string, i: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    const next = [...digits];
    next[i] = clean.slice(-1);
    setDigits(next);
    setError(undefined);
    if (clean && i < len - 1) inputs.current[i + 1]?.focus();
  };

  const onKey = (key: string, i: number) => {
    if (key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = () => {
    // Demo: any 6-digit code except "000000" is accepted.
    if (code === '000000') {
      const n = attempts + 1;
      setAttempts(n);
      setError(n >= APP_CONFIG.maxOtpAttempts ? 'Too many attempts. Please try again later.' : 'Incorrect OTP. Try again.');
      return;
    }
    signIn(phone);
    navigation.replace('Permissions');
  };

  return (
    <Screen>
      <Header onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <AppText variant="h1" style={{marginTop: theme.spacing.lg}}>
          {t.auth.otpTitle}
        </AppText>
        <AppText variant="body" muted style={{marginTop: theme.spacing.sm}}>
          {t.auth.otpSubtitle} +91 {phone}
        </AppText>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xxl}}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={el => {
                inputs.current[i] = el;
              }}
              value={d}
              onChangeText={v => onChange(v, i)}
              onKeyPress={e => onKey(e.nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              style={{
                width: 48,
                height: 58,
                borderRadius: theme.radius.md,
                borderWidth: 1.5,
                borderColor: error ? theme.colors.danger : d ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.surface,
                textAlign: 'center',
                fontSize: 22,
                color: theme.colors.text,
                fontFamily: theme.fontFamily.semiBold,
              }}
            />
          ))}
        </View>

        {error && (
          <AppText variant="caption" color={theme.colors.danger} style={{marginTop: theme.spacing.md}}>
            {error}
          </AppText>
        )}

        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xl, gap: 4}}>
          {running ? (
            <AppText variant="label" muted>
              {t.auth.resendIn} 00:{remaining.toString().padStart(2, '0')}
            </AppText>
          ) : (
            <Pressable onPress={start} hitSlop={8}>
              <AppText variant="label" color={theme.colors.secondary}>
                {t.auth.resend}
              </AppText>
            </Pressable>
          )}
        </View>

        <Button label={t.auth.verify} onPress={verify} disabled={!complete || attempts >= APP_CONFIG.maxOtpAttempts} style={{marginTop: theme.spacing.xxl}} />
        <AppText variant="caption" muted center style={{marginTop: theme.spacing.lg}}>
          Demo build: enter any 6 digits to continue.
        </AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
};

export default OtpScreen;

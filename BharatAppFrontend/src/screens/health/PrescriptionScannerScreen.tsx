import React, {useState} from 'react';
import {View, ActivityIndicator, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {healthService} from '../../services/healthService';
import {Screen, Header, Card, Button, AppText, Icon} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'PrescriptionScanner'>;

const PrescriptionScannerScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [meds, setMeds] = useState<string[]>([]);

  const scan = () => {
    setScanning(true);
    setMeds([]);
    healthService.scanPrescription().then(m => {
      setMeds(m);
      setScanning(false);
    });
  };

  return (
    <Screen scroll padded>
      <Header title={t.health.scanPrescription} onBack={() => navigation.goBack()} />

      {/* Camera frame */}
      <Card style={{alignItems: 'center', paddingVertical: theme.spacing.huge, marginTop: theme.spacing.md, borderStyle: 'dashed', borderWidth: 2, borderColor: theme.colors.border, backgroundColor: theme.colors.cardAlt}}>
        {scanning ? (
          <>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <AppText variant="body" muted style={{marginTop: theme.spacing.md}}>
              Reading prescription… (OCR)
            </AppText>
          </>
        ) : (
          <>
            <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primarySoft, alignItems: 'center', justifyContent: 'center'}}>
              <Icon name="camera" size={38} color={theme.colors.primary} />
            </View>
            <AppText variant="body" muted center style={{marginTop: theme.spacing.md, maxWidth: 260}}>
              Point your camera at a prescription or upload a photo — we'll extract the medicines automatically.
            </AppText>
          </>
        )}
      </Card>

      <View style={{flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg}}>
        <Button label="Take photo" icon="camera" onPress={scan} loading={scanning} style={{flex: 1}} />
        <Button label="Upload" icon="upload" variant="outline" onPress={scan} style={{flex: 1}} />
      </View>

      {/* Extracted meds */}
      {meds.length > 0 && (
        <View style={{marginTop: theme.spacing.xl}}>
          <AppText variant="h3">Detected medicines</AppText>
          <AppText variant="caption" muted style={{marginBottom: theme.spacing.md}}>
            Tap to find nearby. If a name looks wrong, edit it.
          </AppText>
          {meds.map(m => (
            <Pressable key={m} onPress={() => navigation.navigate('Health', {medicine: m})}>
              <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
                <Icon name="check-circle" size={20} color={theme.colors.accent} />
                <AppText variant="body" style={{flex: 1}}>
                  {m}
                </AppText>
                <Icon name="search" size={18} color={theme.colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
};

export default PrescriptionScannerScreen;

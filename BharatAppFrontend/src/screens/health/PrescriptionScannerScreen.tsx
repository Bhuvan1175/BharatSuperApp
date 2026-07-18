import React, {useState} from 'react';
import {View, ActivityIndicator, Pressable} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {healthService, OCR_CONFIDENCE_THRESHOLD} from '../../services/healthService';
import {OcrMedicineMatch} from '../../types';
import {Screen, Header, Card, Button, AppText, Icon, Input, Badge} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'PrescriptionScanner'>;

/** A detected medicine plus local UI state for the confirm-if-unsure flow. */
interface DetectedMed extends OcrMedicineMatch {
  /** User-edited name, if they changed it during confirmation. */
  editedName: string;
  /** Uncertain reads must be explicitly confirmed before they're searchable. */
  confirmed: boolean;
}

const PrescriptionScannerScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [meds, setMeds] = useState<DetectedMed[]>([]);

  const scan = () => {
    setScanning(true);
    setMeds([]);
    healthService.scanPrescription().then(matches => {
      setMeds(
        matches.map(m => ({
          ...m,
          editedName: m.name,
          confirmed: m.confidence >= OCR_CONFIDENCE_THRESHOLD,
        })),
      );
      setScanning(false);
    });
  };

  const updateName = (index: number, name: string) => {
    setMeds(prev => prev.map((m, i) => (i === index ? {...m, editedName: name} : m)));
  };

  const confirmMed = (index: number) => {
    setMeds(prev => prev.map((m, i) => (i === index ? {...m, confirmed: true} : m)));
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
            Tap a confirmed medicine to find it nearby. Uncertain reads need a quick confirm.
          </AppText>
          {meds.map((m, i) =>
            m.confirmed ? (
              <Pressable key={i} onPress={() => navigation.navigate('Health', {medicine: m.editedName})}>
                <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
                  <Icon name="check-circle" size={20} color={theme.colors.accent} />
                  <AppText variant="body" style={{flex: 1}}>
                    {m.editedName}
                  </AppText>
                  <Icon name="search" size={18} color={theme.colors.textMuted} />
                </Card>
              </Pressable>
            ) : (
              <Card key={i} style={{marginBottom: theme.spacing.sm, borderColor: theme.colors.warning, borderWidth: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm}}>
                  <Icon name="alert-triangle" size={16} color={theme.colors.warning} />
                  <AppText variant="bodyStrong" style={{flex: 1}}>
                    Not sure about this one
                  </AppText>
                  <Badge label={`${Math.round(m.confidence * 100)}% match`} color={theme.colors.warning} />
                </View>
                <Input
                  value={m.editedName}
                  onChangeText={name => updateName(i, name)}
                  placeholder="Edit the medicine name"
                  containerStyle={{marginBottom: theme.spacing.sm}}
                />
                <Button
                  label="Confirm"
                  icon="check"
                  size="sm"
                  disabled={!m.editedName.trim()}
                  onPress={() => confirmMed(i)}
                />
              </Card>
            ),
          )}
        </View>
      )}
    </Screen>
  );
};

export default PrescriptionScannerScreen;

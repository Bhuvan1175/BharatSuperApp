import React, {useState} from 'react';
import {View, ActivityIndicator, Pressable, Alert, Image, PermissionsAndroid, Platform} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {scanPrescriptionImage, OCR_CONFIDENCE_THRESHOLD} from '../../services/prescriptionOcr';
import {useMedicines} from '../../hooks/useMedicines';
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

/**
 * Real, end-to-end prescription scanning: camera/gallery photo → on-device
 * ML Kit OCR → fuzzy match against the store's real catalogue
 * (services/prescriptionOcr.ts). No mock data, no cloud API.
 */
const PrescriptionScannerScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {data: catalog} = useMedicines();

  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [meds, setMeds] = useState<DetectedMed[]>([]);
  const [scannedOnce, setScannedOnce] = useState(false);

  const runOcr = async (uri: string) => {
    setImageUri(uri);
    setScanning(true);
    setMeds([]);
    try {
      const matches = await scanPrescriptionImage(uri, catalog ?? []);
      setMeds(
        matches.map(m => ({
          ...m,
          editedName: m.name,
          confirmed: m.confidence >= OCR_CONFIDENCE_THRESHOLD,
        })),
      );
    } catch (e) {
      Alert.alert(
        'Could not read that photo',
        e instanceof Error ? e.message : 'Please try again with a clearer, well-lit photo.',
      );
    } finally {
      setScanning(false);
      setScannedOnce(true);
    }
  };

  /** Android declares CAMERA in the manifest, so it's a dangerous permission the OS
   * requires us to ask for at runtime; react-native-image-picker never prompts for
   * it itself, it just fails with camera_unavailable if we skip this. */
  const ensureCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (already) return true;
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
      title: 'Camera permission',
      message: 'Allow camera access to scan your prescription.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const takePhoto = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) {
      Alert.alert('Camera permission needed', 'Please allow camera access in your device settings to scan a prescription.');
      return;
    }
    const result = await launchCamera({mediaType: 'photo', quality: 0.85, saveToPhotos: false});
    if (result.didCancel) return;
    if (result.errorCode) {
      const title = result.errorCode === 'camera_unavailable' ? 'Camera unavailable' : 'Could not open camera';
      Alert.alert(title, result.errorMessage ?? 'Please check camera permissions and try again.');
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) runOcr(uri);
  };

  const uploadPhoto = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', quality: 0.85, selectionLimit: 1});
    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Could not open gallery', result.errorMessage ?? 'Please check photo permissions and try again.');
      return;
    }
    const uri = result.assets?.[0]?.uri;
    if (uri) runOcr(uri);
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

      {/* Camera frame / preview */}
      <Card
        style={{
          alignItems: 'center',
          paddingVertical: imageUri ? theme.spacing.sm : theme.spacing.huge,
          marginTop: theme.spacing.md,
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.cardAlt,
          overflow: 'hidden',
        }}>
        {scanning ? (
          <>
            {imageUri && (
              <Image source={{uri: imageUri}} style={{width: '100%', height: 160, borderRadius: theme.radius.md, marginBottom: theme.spacing.md}} resizeMode="cover" />
            )}
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <AppText variant="body" muted style={{marginTop: theme.spacing.md}}>
              Reading prescription… (on-device OCR)
            </AppText>
          </>
        ) : imageUri ? (
          <Image source={{uri: imageUri}} style={{width: '100%', height: 200, borderRadius: theme.radius.md}} resizeMode="cover" />
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
        <Button label="Take photo" icon="camera" onPress={takePhoto} loading={scanning} disabled={scanning} style={{flex: 1}} />
        <Button label="Upload" icon="upload" variant="outline" onPress={uploadPhoto} disabled={scanning} style={{flex: 1}} />
      </View>

      {/* Extracted meds */}
      {meds.length > 0 && (
        <View style={{marginTop: theme.spacing.xl}}>
          <AppText variant="h3">Detected medicines</AppText>
          <AppText variant="caption" muted style={{marginBottom: theme.spacing.md}}>
            Tap a confirmed medicine to find it at your store. Uncertain reads need a quick confirm.
          </AppText>
          {meds.map((m, i) =>
            m.confirmed ? (
              <Pressable key={i} onPress={() => navigation.navigate('Health', {medicine: m.editedName})}>
                <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm}}>
                  <Icon name="check-circle" size={20} color={theme.colors.accent} />
                  <View style={{flex: 1}}>
                    <AppText variant="body">{m.editedName}</AppText>
                    {m.medicineId && (
                      <AppText variant="caption" color={theme.colors.accent}>
                        Matches your store's catalogue
                      </AppText>
                    )}
                  </View>
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

      {/* Nothing readable found */}
      {scannedOnce && !scanning && meds.length === 0 && (
        <Card style={{marginTop: theme.spacing.xl, alignItems: 'center', paddingVertical: theme.spacing.xl}}>
          <Icon name="frown" size={28} color={theme.colors.textMuted} />
          <AppText variant="body" muted center style={{marginTop: theme.spacing.sm, maxWidth: 260}}>
            We couldn't read any medicine names from that photo. Try a clearer, well-lit, straight-on shot.
          </AppText>
        </Card>
      )}
    </Screen>
  );
};

export default PrescriptionScannerScreen;

import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {areaService} from '../../services/areaService';
import {AREAS} from '../../data/areas';
import {Area} from '../../types';
import {Screen, Header} from '../../components/common';
import AreaDetail from './AreaDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'AreaScore'>;

const AreaScoreScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [area, setArea] = useState<Area | null>(null);

  useEffect(() => {
    const {areaId, query} = route.params ?? {};
    if (areaId) {
      setArea(AREAS.find(a => a.id === areaId) ?? AREAS[0]);
    } else {
      areaService.getScore(query ?? 'Baner').then(setArea);
    }
  }, [route.params]);

  return (
    <Screen scroll padded>
      <Header title={t.explore.areaScore} onBack={() => navigation.goBack()} />
      {area ? (
        <View style={{marginTop: theme.spacing.md}}>
          <AreaDetail area={area} />
        </View>
      ) : (
        <ActivityIndicator color={theme.colors.primary} style={{marginTop: theme.spacing.huge}} />
      )}
    </Screen>
  );
};

export default AreaScoreScreen;

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {schemeService} from '../../services/schemeService';
import {Scheme, SchemeCategory} from '../../types';
import {Screen, Header, AppText, EmptyState, FadeInView} from '../../components/common';
import {SchemeCard} from '../../components/cards';

type Props = NativeStackScreenProps<RootStackParamList, 'SchemeResults'>;

const SchemeResultsScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {toggleSaved, isSaved} = useAppData();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const category = route.params?.category as SchemeCategory | undefined;

  useEffect(() => {
    setLoading(true);
    const req = category
      ? schemeService.byCategory(category)
      : schemeService.checkEligibility({age: '24', occupation: 'Student', income: '250000', state: 'Maharashtra', gender: 'Female'});
    req.then(s => {
      setSchemes(s);
      setLoading(false);
    });
  }, [category]);

  return (
    <Screen scroll padded>
      <Header title={category ?? t.government.results} subtitle={`${schemes.length} schemes`} onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={{alignItems: 'center', paddingVertical: theme.spacing.huge}}>
          <ActivityIndicator color={theme.colors.primary} />
          <AppText variant="caption" muted style={{marginTop: theme.spacing.md}}>
            Matching schemes to your profile…
          </AppText>
        </View>
      ) : schemes.length === 0 ? (
        <EmptyState icon="award" title="No schemes found" subtitle="Try a different category or adjust your details." />
      ) : (
        <View style={{marginTop: theme.spacing.md}}>
          {schemes.map((s, i) => (
            <FadeInView key={s.id} delay={i * 50}>
              <SchemeCard scheme={s} saved={isSaved('schemes', s.name)} onSave={() => toggleSaved('schemes', s.name)} />
            </FadeInView>
          ))}
        </View>
      )}
    </Screen>
  );
};

export default SchemeResultsScreen;

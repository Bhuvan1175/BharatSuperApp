import React from 'react';
import {View, ScrollView, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {SCHEME_CATEGORIES} from '../../constants/categories';
import {AppText, Card, Icon, Button, SectionHeader, AIOrb, FadeInView} from '../../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GovernmentScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: theme.spacing.lg, paddingBottom: theme.spacing.giant}}>
        <AppText variant="h2">{t.government.title}</AppText>

        {/* AI prompt hero */}
        <FadeInView>
          <Card style={{marginTop: theme.spacing.lg, alignItems: 'center'}}>
            <AIOrb size={72} />
            <AppText variant="h3" center style={{marginTop: theme.spacing.md}}>
              {t.government.prompt}
            </AppText>
            <AppText variant="caption" muted center style={{marginTop: 4, maxWidth: 280}}>
              Tell me your details and I'll match you to schemes you likely qualify for.
            </AppText>
            <Button
              label={t.government.checkEligibility}
              icon="clipboard"
              onPress={() => navigation.navigate('Eligibility')}
              style={{marginTop: theme.spacing.lg}}
            />
          </Card>
        </FadeInView>

        {/* Categories */}
        <SectionHeader title={t.government.categories} />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md}}>
          {SCHEME_CATEGORIES.map((c, i) => (
            <FadeInView key={c.key} delay={i * 40} style={{width: '47.5%'}}>
              <Pressable onPress={() => navigation.navigate('SchemeResults', {category: c.key})}>
                <Card style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
                  <View style={{width: 40, height: 40, borderRadius: theme.radius.sm, backgroundColor: theme.colors.secondarySoft, alignItems: 'center', justifyContent: 'center'}}>
                    <Icon name={c.icon} size={19} color={theme.colors.secondary} />
                  </View>
                  <AppText variant="label" style={{flex: 1}}>
                    {c.key}
                  </AppText>
                </Card>
              </Pressable>
            </FadeInView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GovernmentScreen;

import React, {useRef, useState} from 'react';
import {View, FlatList, useWindowDimensions, Pressable, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../hooks/useTranslation';
import {languageOptions} from '../../localization';
import {LanguageCode} from '../../types';
import {AppText, Button, AIOrb, Icon} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t, language, setLanguage} = useTranslation();
  const {completeOnboarding} = useAuth();
  const {width} = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const slides = [
    {title: t.onboarding.slide1Title, body: t.onboarding.slide1Body, icon: 'grid'},
    {title: t.onboarding.slide2Title, body: t.onboarding.slide2Body, icon: 'mic'},
    {title: t.onboarding.slide3Title, body: t.onboarding.slide3Body, icon: 'zap'},
  ];

  const finish = () => {
    completeOnboarding();
    navigation.replace('Login');
  };

  const next = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({index: index + 1});
    } else {
      finish();
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing.lg}}>
        <Pressable onPress={finish} hitSlop={10}>
          <AppText variant="label" muted>
            {t.common.skip}
          </AppText>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({item, index: i}) => (
          <View style={{width, alignItems: 'center', paddingHorizontal: theme.spacing.xxl}}>
            <View style={{height: 40}} />
            {i === 1 || i === 2 ? (
              <AIOrb size={128} />
            ) : (
              <View
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 40,
                  backgroundColor: theme.colors.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name={item.icon} size={64} color={theme.colors.primary} />
              </View>
            )}
            <AppText variant="h1" center style={{marginTop: theme.spacing.giant}}>
              {item.title}
            </AppText>
            <AppText variant="body" muted center style={{marginTop: theme.spacing.md, maxWidth: 300}}>
              {item.body}
            </AppText>
          </View>
        )}
      />

      {/* Language picker */}
      <View style={{paddingHorizontal: theme.spacing.xl}}>
        <AppText variant="label" muted center style={{marginBottom: theme.spacing.sm}}>
          {t.onboarding.chooseLanguage}
        </AppText>
        <View style={{flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.md}}>
          {languageOptions.map(opt => {
            const active = language === opt.code;
            return (
              <Pressable
                key={opt.code}
                onPress={() => setLanguage(opt.code as LanguageCode)}
                style={{
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.radius.pill,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primarySoft : 'transparent',
                }}>
                <AppText variant="label" color={active ? theme.colors.primary : theme.colors.text}>
                  {opt.native}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Dots + CTA */}
      <View style={{padding: theme.spacing.xl}}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 3,
                backgroundColor: i === index ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>
        <Button
          label={index === slides.length - 1 ? t.onboarding.getStarted : t.common.next}
          iconRight="arrow-right"
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  dots: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20},
});

export default OnboardingScreen;

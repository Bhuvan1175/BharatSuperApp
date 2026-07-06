import React from 'react';
import {View, StyleSheet, ScrollView, StyleProp, ViewStyle, ScrollViewProps} from 'react-native';
import {SafeAreaView, Edge} from 'react-native-safe-area-context';
import {useTheme} from '../../context/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  backgroundColor?: string;
  scrollProps?: ScrollViewProps;
}

/** Consistent safe-area screen container with optional scroll + padding. */
const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  edges = ['top'],
  backgroundColor,
  scrollProps,
}) => {
  const {theme} = useTheme();
  const bg = backgroundColor ?? theme.colors.background;
  const pad = padded ? {padding: theme.spacing.lg} : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.safe, {backgroundColor: bg}, style]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[pad, {paddingBottom: theme.spacing.giant}, contentStyle]}
          {...scrollProps}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1},
  flex: {flex: 1},
});

export default Screen;

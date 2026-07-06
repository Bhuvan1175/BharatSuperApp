import React, {useEffect, useRef} from 'react';
import {View, Animated, Easing} from 'react-native';
import {useTheme} from '../../context/ThemeContext';

/** Three-dot typing indicator shown while the AI engine runs. */
const TypingIndicator: React.FC = () => {
  const {theme} = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, {toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
          Animated.timing(d, {toValue: 0, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        ]),
      ),
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.chatAiBubble,
        borderColor: theme.colors.border,
        borderWidth: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderBottomLeftRadius: theme.radius.xs,
      }}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: theme.colors.textMuted,
            opacity: d.interpolate({inputRange: [0, 1], outputRange: [0.3, 1]}),
            transform: [{translateY: d.interpolate({inputRange: [0, 1], outputRange: [0, -4]})}],
          }}
        />
      ))}
    </View>
  );
};

export default TypingIndicator;

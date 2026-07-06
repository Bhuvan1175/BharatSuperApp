import React, {useEffect, useRef} from 'react';
import {Animated, ViewStyle, StyleProp, AccessibilityInfo, Easing} from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  offset?: number; // translateY start
  style?: StyleProp<ViewStyle>;
}

/**
 * fadeUp micro-animation from the design system (subtle 200-400ms, respects
 * reduced-motion). Used on screen enter and list items.
 */
const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 320,
  offset = 12,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (cancelled) return;
      if (reduced) {
        opacity.setValue(1);
        translateY.setValue(0);
        return;
      }
      Animated.parallel([
        Animated.timing(opacity, {toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
        Animated.timing(translateY, {toValue: 0, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true}),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [opacity, translateY, delay, duration]);

  return <Animated.View style={[{opacity, transform: [{translateY}]}, style]}>{children}</Animated.View>;
};

export default FadeInView;

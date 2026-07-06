import React, {useEffect, useRef} from 'react';
import {Animated, View, Easing, AccessibilityInfo} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {palette} from '../../theme/colors';

interface AIOrbProps {
  size?: number;
}

const AnimatedView = Animated.View;

/**
 * The pulsing/glowing gradient AI orb (blue + saffron) — the centrepiece of the
 * AI Chat empty state. Subtly pulses and respects reduced-motion.
 */
const AIOrb: React.FC<AIOrbProps> = ({size = 120}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, {toValue: 1.08, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
            Animated.timing(glow, {toValue: 0.75, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
          ]),
          Animated.parallel([
            Animated.timing(scale, {toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
            Animated.timing(glow, {toValue: 0.4, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
          ]),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [scale, glow]);

  return (
    <View style={{width: size * 1.5, height: size * 1.5, alignItems: 'center', justifyContent: 'center'}}>
      <AnimatedView
        style={{
          position: 'absolute',
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: size,
          backgroundColor: palette.royalBlue,
          opacity: glow,
          transform: [{scale}],
        }}
      />
      <AnimatedView style={{transform: [{scale}]}}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="orb" cx="35%" cy="30%" r="80%">
              <Stop offset="0%" stopColor={palette.saffron} stopOpacity="1" />
              <Stop offset="55%" stopColor="#8B3FCF" stopOpacity="1" />
              <Stop offset="100%" stopColor={palette.royalBlue} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="url(#orb)" />
        </Svg>
      </AnimatedView>
    </View>
  );
};

export default AIOrb;

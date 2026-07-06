import React from 'react';
import {View} from 'react-native';
import Svg, {Rect, Path, Circle, Line, Defs, LinearGradient, Stop} from 'react-native-svg';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface MapPreviewProps {
  label?: string;
  height?: number;
  pinColor?: string;
}

/**
 * Stylised map preview. Renders a lightweight vector "map" so the UI is complete
 * without a Maps API key. Swap for react-native-maps + MapmyIndia/Google in prod.
 */
const MapPreview: React.FC<MapPreviewProps> = ({label, height = 150, pinColor}) => {
  const {theme} = useTheme();
  const pin = pinColor ?? theme.colors.primary;
  const roadColor = theme.mode === 'dark' ? '#2A2A33' : '#E3E3DF';
  const landColor = theme.mode === 'dark' ? '#191921' : '#EDEDE8';
  const blockColor = theme.mode === 'dark' ? '#20202A' : '#E4E9E2';

  return (
    <View
      style={{
        height,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}>
      <Svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="water" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.mode === 'dark' ? '#14202E' : '#DCEAF5'} />
            <Stop offset="1" stopColor={theme.mode === 'dark' ? '#101A26' : '#CFE2F2'} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="320" height="160" fill={landColor} />
        <Path d="M0 120 Q 80 100 160 118 T 320 110 V160 H0 Z" fill="url(#water)" />
        <Rect x="24" y="20" width="70" height="46" rx="4" fill={blockColor} />
        <Rect x="120" y="16" width="80" height="40" rx="4" fill={blockColor} />
        <Rect x="230" y="24" width="66" height="50" rx="4" fill={blockColor} />
        <Rect x="40" y="82" width="70" height="34" rx="4" fill={blockColor} />
        <Rect x="150" y="74" width="60" height="30" rx="4" fill={blockColor} />
        <Line x1="0" y1="70" x2="320" y2="62" stroke={roadColor} strokeWidth="8" />
        <Line x1="110" y1="0" x2="128" y2="160" stroke={roadColor} strokeWidth="7" />
        <Line x1="215" y1="0" x2="228" y2="120" stroke={roadColor} strokeWidth="5" />
        <Circle cx="160" cy="78" r="16" fill={pin} opacity={0.18} />
      </Svg>
      <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="map-pin" size={30} color={pin} />
      </View>
      {label && (
        <View
          style={{
            position: 'absolute',
            bottom: theme.spacing.sm,
            left: theme.spacing.sm,
            backgroundColor: theme.colors.card,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: 6,
            borderRadius: theme.radius.pill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            ...theme.shadows.sm,
          }}>
          <Icon name="navigation" size={13} color={theme.colors.secondary} />
          <AppText variant="caption">{label}</AppText>
        </View>
      )}
    </View>
  );
};

export default MapPreview;

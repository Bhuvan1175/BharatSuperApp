import React from 'react';
import {View} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {useTheme} from '../../context/ThemeContext';
import {scoreColor} from '../../utils/helpers';
import AppText from './AppText';

interface ScoreCircleProps {
  score: number; // 0-10
  label?: string;
  size?: number;
  strokeWidth?: number;
}

/** Large circular 0-10 area score with a coloured progress ring. */
const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  label,
  size = 132,
  strokeWidth = 10,
}) => {
  const {theme} = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(score / 10, 1));
  const dash = circumference * pct;
  const color = scoreColor(score);

  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <Svg width={size} height={size} style={{position: 'absolute', transform: [{rotate: '-90deg'}]}}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.colors.cardAlt} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          fill="none"
        />
      </Svg>
      <AppText variant="h1" color={color} style={{fontSize: size * 0.3}}>
        {score.toFixed(1)}
      </AppText>
      {label && (
        <AppText variant="caption" color={color} style={{fontWeight: '700', marginTop: 2}}>
          {label}
        </AppText>
      )}
    </View>
  );
};

export default ScoreCircle;

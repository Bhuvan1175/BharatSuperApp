import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {ComparisonCard as ComparisonData} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import {scoreColor} from '../../utils/helpers';

const Side: React.FC<{name: string; score: number; highlights: string[]; winner: boolean}> = ({
  name,
  score,
  highlights,
  winner,
}) => {
  const {theme} = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: winner ? theme.colors.primarySoft : theme.colors.cardAlt,
        borderWidth: winner ? 1.5 : 1,
        borderColor: winner ? theme.colors.primary : theme.colors.border,
      }}>
      <AppText variant="bodyStrong" numberOfLines={1}>{name}</AppText>
      <AppText variant="h2" color={scoreColor(score)}>
        {score.toFixed(1)}
      </AppText>
      {highlights.map((h, i) => (
        <View key={i} style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2}}>
          <Icon name="check" size={11} color={theme.colors.accent} />
          <AppText variant="caption" muted>
            {h}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const ComparisonCard: React.FC<{data: ComparisonData}> = ({data}) => {
  const {theme} = useTheme();
  const aWins = data.optionA.score >= data.optionB.score;
  return (
    <Card>
      <AppText variant="title" style={{marginBottom: theme.spacing.md}}>
        {data.title}
      </AppText>
      <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
        <Side {...data.optionA} winner={aWins} />
        <Side {...data.optionB} winner={!aWins} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.secondarySoft,
          borderRadius: theme.radius.sm,
        }}>
        <Icon name="award" size={16} color={theme.colors.secondary} />
        <AppText variant="label" style={{flex: 1}}>
          {data.recommendation}
        </AppText>
      </View>
    </Card>
  );
};

export default ComparisonCard;

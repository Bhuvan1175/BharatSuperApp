import React from 'react';
import {View} from 'react-native';
import {RichCard} from '../../types';
import {useTheme} from '../../context/ThemeContext';
import AreaScoreCard from '../cards/AreaScoreCard';
import PharmacyCard from '../cards/PharmacyCard';
import SchemeCard from '../cards/SchemeCard';
import FuelStationCard from '../cards/FuelStationCard';
import ComparisonCard from '../cards/ComparisonCard';

interface Props {
  cards: RichCard[];
  onOpenArea?: () => void;
}

/** Renders the AI response's rich cards inline in a chat bubble. */
const RichCardRenderer: React.FC<Props> = ({cards, onOpenArea}) => {
  const {theme} = useTheme();
  return (
    <View style={{gap: theme.spacing.sm, marginTop: theme.spacing.sm}}>
      {cards.map((card, idx) => {
        switch (card.kind) {
          case 'area':
            return <AreaScoreCard key={idx} area={card.data} onPress={onOpenArea} />;
          case 'pharmacies':
            return (
              <View key={idx}>
                {card.data.map(p => (
                  <PharmacyCard key={p.id} pharmacy={p} />
                ))}
              </View>
            );
          case 'scheme':
            return <SchemeCard key={idx} scheme={card.data} />;
          case 'fuel':
            return (
              <View key={idx}>
                {card.data.map(s => (
                  <FuelStationCard key={s.id} station={s} />
                ))}
              </View>
            );
          case 'comparison':
            return <ComparisonCard key={idx} data={card.data} />;
          default:
            return null;
        }
      })}
    </View>
  );
};

export default RichCardRenderer;

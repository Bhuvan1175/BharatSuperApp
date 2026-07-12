import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import {ModuleConfig} from '@/rbac';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon} from '@components/common';

interface ModuleCardProps {
  /** The module to render, from the RBAC MODULES registry. */
  module: ModuleConfig;
  onPress?: () => void;
  showDescription?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * ModuleCard — renders a super-app module straight from its RBAC ModuleConfig
 * (icon, colour, label, description). Because it's registry-driven, a new
 * module shows up wherever ModuleCard is used with zero extra code.
 */
const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onPress,
  showDescription = true,
  style,
}) => {
  const {theme} = useTheme();
  return (
    <Card onPress={onPress} style={style}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: module.color + '22',
        }}>
        <Icon name={module.icon} size={20} color={module.color} />
      </View>
      <AppText
        variant="title"
        numberOfLines={1}
        style={{marginTop: theme.spacing.sm}}>
        {module.label}
      </AppText>
      {showDescription && (
        <AppText variant="caption" muted numberOfLines={2}>
          {module.description}
        </AppText>
      )}
    </Card>
  );
};

export default ModuleCard;

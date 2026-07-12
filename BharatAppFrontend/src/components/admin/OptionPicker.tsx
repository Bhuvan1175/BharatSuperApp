import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText} from '@components/common';

export interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  options: PickerOption[];
  value?: string;
  onChange: (value: string) => void;
}

/** Simple single-select pill picker for admin forms (department / role). */
const OptionPicker: React.FC<Props> = ({label, options, value, onChange}) => {
  const {theme} = useTheme();
  return (
    <View style={{marginBottom: theme.spacing.lg}}>
      {label && (
        <AppText variant="label" muted style={{marginBottom: theme.spacing.sm}}>
          {label}
        </AppText>
      )}
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm}}>
        {options.map(opt => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: active
                  ? theme.colors.primary
                  : theme.colors.cardAlt,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              }}>
              <AppText
                variant="label"
                color={active ? theme.colors.textInverse : theme.colors.text}>
                {opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default OptionPicker;

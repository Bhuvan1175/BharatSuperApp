import React from 'react';
import {Pressable, View, TextInput, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import Icon from './Icon';

interface SearchBarProps {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  onPress?: () => void; // when acting as a button (Home)
  onSubmit?: () => void;
  onVoicePress?: () => void;
  showAi?: boolean;
  showVoice?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The signature AI search bar: AI orb icon on the left, voice icon on the right.
 * On Home it behaves as a button (onPress opens AI Chat); elsewhere it's a live
 * text input.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onPress,
  onSubmit,
  onVoicePress,
  showAi = true,
  showVoice = true,
  editable = true,
  autoFocus,
  style,
}) => {
  const {theme} = useTheme();

  const inner = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          height: 54,
          gap: theme.spacing.sm,
          ...theme.shadows.sm,
        },
        style,
      ]}>
      {showAi && (
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primarySoft,
          }}>
          <Icon name="zap" size={16} color={theme.colors.primary} />
        </View>
      )}
      {onPress ? (
        <View style={{flex: 1}}>
          <PlaceholderText text={placeholder ?? ''} />
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          editable={editable}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontFamily: theme.fontFamily.regular,
            fontSize: 15,
          }}
        />
      )}
      {showVoice && (
        <Pressable onPress={onVoicePress} hitSlop={8}>
          <Icon name="mic" size={20} color={theme.colors.secondary} />
        </Pressable>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="search" onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return inner;
};

const PlaceholderText: React.FC<{text: string}> = ({text}) => {
  const {theme} = useTheme();
  return (
    <TextInput
      editable={false}
      pointerEvents="none"
      placeholder={text}
      placeholderTextColor={theme.colors.textMuted}
      style={{color: theme.colors.text, fontFamily: theme.fontFamily.regular, fontSize: 15}}
    />
  );
};

export default SearchBar;

import React, {useEffect, useRef} from 'react';
import {View, Animated, Pressable, Easing} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {ChatMessage} from '../../types';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import RichCardRenderer from './RichCardRenderer';

interface ChatBubbleProps {
  message: ChatMessage;
  onAction?: (target?: string) => void;
  onOpenArea?: () => void;
}

/** Chat message bubble with bubbleIn animation, rich cards, CTAs, sources. */
const ChatBubble: React.FC<ChatBubbleProps> = ({message, onAction, onOpenArea}) => {
  const {theme} = useTheme();
  const isUser = message.role === 'user';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.back(1.3)),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {scale: anim.interpolate({inputRange: [0, 1], outputRange: [0.94, 1]})},
          {translateY: anim.interpolate({inputRange: [0, 1], outputRange: [8, 0]})},
        ],
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '90%',
        marginBottom: theme.spacing.md,
      }}>
      <View
        style={{
          backgroundColor: isUser ? theme.colors.chatUserBubble : theme.colors.chatAiBubble,
          borderWidth: isUser ? 0 : 1,
          borderColor: theme.colors.border,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radius.lg,
          borderBottomRightRadius: isUser ? theme.radius.xs : theme.radius.lg,
          borderBottomLeftRadius: isUser ? theme.radius.lg : theme.radius.xs,
        }}>
        <AppText variant="body" color={isUser ? theme.colors.textInverse : theme.colors.text}>
          {message.text}
        </AppText>
      </View>

      {!!message.cards?.length && (
        <View style={{width: '100%', minWidth: 280}}>
          <RichCardRenderer cards={message.cards} onOpenArea={onOpenArea} />
        </View>
      )}

      {!!message.actions?.length && (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm}}>
          {message.actions.map(a => (
            <Pressable
              key={a.id}
              onPress={() => onAction?.(a.target)}
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.85 : 1,
              })}>
              <Icon name={a.icon} size={14} color={theme.colors.textInverse} />
              <AppText variant="label" color={theme.colors.textInverse}>
                {a.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      {!isUser && !!message.sources?.length && (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: theme.spacing.sm}}>
          <Icon name="info" size={12} color={theme.colors.textMuted} />
          <AppText variant="caption" muted numberOfLines={1} style={{flex: 1}}>
            Sources: {message.sources.join(' · ')}
          </AppText>
        </View>
      )}

      {!isUser && !message.pending && (
        <View style={{flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.sm, marginLeft: 4}}>
          <Icon name="thumbs-up" size={15} color={theme.colors.textMuted} />
          <Icon name="thumbs-down" size={15} color={theme.colors.textMuted} />
        </View>
      )}
    </Animated.View>
  );
};

export default ChatBubble;

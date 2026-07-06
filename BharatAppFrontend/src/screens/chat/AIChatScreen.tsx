import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, FlatList, Pressable, KeyboardAvoidingView, Platform, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {navigateTo} from '../../navigation/navigationRef';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {aiService, toAssistantMessage} from '../../services/aiService';
import {ChatMessage} from '../../types';
import {uid} from '../../utils/helpers';
import {AppText, AIOrb, Icon, Header} from '../../components/common';
import {ChatBubble, TypingIndicator, SuggestionChip} from '../../components/chat';

type Props = NativeStackScreenProps<RootStackParamList, 'AIChat'>;

const AIChatScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {addRecent} = useAppData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;
      addRecent(trimmed);
      const userMsg: ChatMessage = {id: uid('msg'), role: 'user', text: trimmed, createdAt: Date.now()};
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setTyping(true);
      const res = await aiService.ask(trimmed);
      setTyping(false);
      setMessages(prev => [...prev, toAssistantMessage(res)]);
    },
    [addRecent, typing],
  );

  // Auto-send an initial query passed via deep-link (e.g. from Home).
  useEffect(() => {
    if (route.params?.initialQuery) {
      send(route.params.initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.initialQuery]);

  useEffect(() => {
    const id = setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 120);
    return () => clearTimeout(id);
  }, [messages, typing]);

  const empty = messages.length === 0 && !typing;

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{paddingHorizontal: theme.spacing.lg}}>
        <Header
          title={t.chat.title}
          subtitle={typing ? t.chat.thinking : 'Smart · helpful · trustworthy'}
          onBack={() => navigation.goBack()}
          right={<Icon name="more-vertical" size={20} color={theme.colors.textMuted} />}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={{flex: 1}}>
        {empty ? (
          <EmptyChat onPick={send} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{padding: theme.spacing.lg}}
            showsVerticalScrollIndicator={false}
            renderItem={({item}) => (
              <ChatBubble
                message={item}
                onAction={target => navigateTo(target)}
                onOpenArea={() => navigateTo('ExploreTab')}
              />
            )}
            ListFooterComponent={typing ? <TypingIndicator /> : null}
          />
        )}

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.cardAlt,
              borderRadius: theme.radius.pill,
              paddingHorizontal: theme.spacing.lg,
            }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t.chat.inputPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              style={{flex: 1, color: theme.colors.text, fontFamily: theme.fontFamily.regular, fontSize: 15, paddingVertical: theme.spacing.md}}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
            />
            <Pressable onPress={() => setListening(l => !l)} hitSlop={8}>
              <Icon name="mic" size={20} color={listening ? theme.colors.danger : theme.colors.secondary} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() ? theme.colors.primary : theme.colors.border,
            }}>
            <Icon name="send" size={20} color={theme.colors.textInverse} />
          </Pressable>
        </View>
        {listening && (
          <View style={{position: 'absolute', bottom: 84, alignSelf: 'center', backgroundColor: theme.colors.danger, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.pill}}>
            <AppText variant="caption" color={theme.colors.textInverse}>
              Listening… (voice transcription)
            </AppText>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const EmptyChat: React.FC<{onPick: (q: string) => void}> = ({onPick}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  return (
    <View style={{flex: 1, padding: theme.spacing.xl, justifyContent: 'center'}}>
      <View style={{alignItems: 'center', marginBottom: theme.spacing.xxl}}>
        <AIOrb size={110} />
        <AppText variant="h2" center style={{marginTop: theme.spacing.lg}}>
          {t.chat.emptyGreeting}
        </AppText>
        <AppText variant="body" muted center style={{marginTop: theme.spacing.sm, maxWidth: 300}}>
          {t.chat.emptySub}
        </AppText>
      </View>
      <View style={{gap: theme.spacing.md}}>
        {t.chat.suggestions.map(s => (
          <SuggestionChip key={s} label={s} onPress={() => onPick(s)} />
        ))}
      </View>
    </View>
  );
};

export default AIChatScreen;

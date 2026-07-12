import React from 'react';
import {View} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText, Button, Icon} from '@components/common';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  /** Fill and centre the screen (default). Set false for inline use. */
  fullscreen?: boolean;
}

/** ErrorState — consistent error display with an optional retry action. */
const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  fullscreen = true,
}) => {
  const {theme} = useTheme();
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          padding: theme.spacing.xl,
        },
        fullscreen
          ? {flex: 1, backgroundColor: theme.colors.background}
          : {paddingVertical: theme.spacing.xxxl},
      ]}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.dangerSoft,
        }}>
        <Icon name="alert-triangle" size={28} color={theme.colors.danger} />
      </View>
      <AppText variant="title" center>
        {title}
      </AppText>
      {message && (
        <AppText variant="body" muted center style={{maxWidth: 280}}>
          {message}
        </AppText>
      )}
      {onRetry && (
        <Button
          label="Try again"
          onPress={onRetry}
          variant="outline"
          fullWidth={false}
          style={{marginTop: theme.spacing.md}}
        />
      )}
    </View>
  );
};

export default ErrorState;

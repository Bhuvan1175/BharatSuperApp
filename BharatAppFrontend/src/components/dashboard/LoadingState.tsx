import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText} from '@components/common';

interface LoadingStateProps {
  message?: string;
  /** Fill and centre the screen (default). Set false for inline use. */
  fullscreen?: boolean;
}

/** LoadingState — consistent spinner + optional message for any dashboard. */
const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  fullscreen = true,
}) => {
  const {theme} = useTheme();
  return (
    <View
      style={[
        {alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md},
        fullscreen
          ? {flex: 1, backgroundColor: theme.colors.background}
          : {paddingVertical: theme.spacing.xxxl},
      ]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      {message && (
        <AppText variant="body" muted center>
          {message}
        </AppText>
      )}
    </View>
  );
};

export default LoadingState;

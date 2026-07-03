import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Appearance } from 'react-native';
import { withTranslation, WithTranslation } from 'react-i18next';
import { getTheme } from '../theme';
import { captureException } from '../services/monitoring';

interface Props extends WithTranslation {
  children: ReactNode;
}

const MAX_ATTEMPTS = 3;

interface State {
  hasError: boolean;
  retryCount: number;
}

class ErrorBoundaryBase extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack ?? '' });
    this.setState((prev) => ({ retryCount: prev.retryCount + 1 }));
  }

  handleRetry = (): void => {
    if (this.state.retryCount >= MAX_ATTEMPTS) return;
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    const { t } = this.props;
    if (this.state.hasError) {
      const { colors } = getTheme(Appearance.getColorScheme());
      const themed = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 12,
        },
        title: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
        },
        button: {
          marginTop: 8,
          borderWidth: 1,
          borderColor: colors.textSecondary,
          paddingHorizontal: 28,
          paddingVertical: 10,
          borderRadius: 20,
        },
        buttonText: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 13,
        },
      });

      return (
        <View style={themed.container}>
          <Text style={themed.title}>{t('errorBoundary.title')}</Text>
          <Text style={themed.subtitle}>{t('errorBoundary.subtitle')}</Text>
          {this.state.retryCount < MAX_ATTEMPTS ? (
            <TouchableOpacity
              style={themed.button}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel={t('common.tryAgain')}
            >
              <Text style={themed.buttonText}>{t('common.tryAgain')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={themed.subtitle}>{t('errorBoundary.final')}</Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);

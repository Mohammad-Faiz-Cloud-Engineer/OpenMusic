import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme';
import { useSettingsStore, type ThemeMode, type HomeSectionId } from '../store/settingsStore';
import { useRecentStore } from '../store/recentStore';
import { a11yButton } from '../utils/a11y';
import type { TabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/tokens';

const GITHUB_URL = 'https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic';

// Read version from package.json at bundle time, always in sync without needing extra dependencies.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_VERSION: string = (require('../../package.json') as { version: string }).version;

type SettingsScreenProps = BottomTabScreenProps<TabParamList, 'Settings'>;

// buildStyles is defined before the sub-components so the return type is available to them.
function buildStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
    headerTitle: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 180 },
    section: { marginBottom: 28, paddingHorizontal: 16 },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    sectionCard: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    },
    segmented: {
      flexDirection: 'row',
      margin: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    segmentFirst: { borderTopLeftRadius: 11, borderBottomLeftRadius: 11 },
    segmentLast: { borderTopRightRadius: 11, borderBottomRightRadius: 11 },
    segmentActive: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)',
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
      gap: 12,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
    rowSublabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    rowValue: { fontSize: 13, color: colors.textMuted },
    pickerPad: {
      paddingHorizontal: 14,
      paddingBottom: 14,
    },
  });
}

type Styles = ReturnType<typeof buildStyles>;

interface SectionProps {
  label: string;
  styles: Styles;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, styles, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  colors: ThemeColors;
  isDark: boolean;
  styles: Styles;
}

function SegmentedControl<T extends string>({
  options, selected, onSelect, colors, isDark, styles,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map((opt, i) => {
        const isActive = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentBtn,
              i === 0 && styles.segmentFirst,
              i === options.length - 1 && styles.segmentLast,
              isActive && styles.segmentActive,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
            {...a11yButton(opt.label)}
          >
            {isActive && (
              <BlurView
                intensity={isDark ? 30 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={[
                styles.segmentText,
                isActive && { color: colors.text, fontWeight: '700' },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface RowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  colors: ThemeColors;
  styles: Styles;
}

const Row: React.FC<RowProps> = ({
  icon, iconColor, label, sublabel, value, onPress, destructive, colors, styles,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
    {...(onPress ? a11yButton(label) : {})}
  >
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: iconColor ? `${iconColor}22` : colors.surface3 },
      ]}
    >
      <Ionicons name={icon} size={18} color={iconColor ?? colors.textSecondary} />
    </View>
    <View style={styles.rowBody}>
      <Text style={[styles.rowLabel, destructive && { color: '#FF453A' }]}>{label}</Text>
      {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
    </View>
    {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    {onPress && !destructive ? (
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.textMuted}
        style={{ marginLeft: 4 }}
      />
    ) : null}
  </TouchableOpacity>
);

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ThemeColors;
  styles: Styles;
  isDark: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  icon, iconColor, label, value, onValueChange, colors, styles, isDark,
}) => (
  <View style={styles.row}>
    <View
      style={[
        styles.rowIcon,
        { backgroundColor: iconColor ? `${iconColor}22` : colors.surface3 },
      ]}
    >
      <Ionicons name={icon} size={18} color={iconColor ?? colors.textSecondary} />
    </View>
    <View style={styles.rowBody}>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.surface3, true: colors.accent }}
      thumbColor={isDark ? '#fff' : '#fff'}
    />
  </View>
);

const Divider: React.FC<{ colors: ThemeColors }> = ({ colors }) => (
  <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 56 }} />
);

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { t } = useTranslation();
  const { colors, gradients, isDark } = useTheme();

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const homeSections = useSettingsStore((s) => s.homeSections);
  const setHomeSection = useSettingsStore((s) => s.setHomeSection);
  const clearRecent = useRecentStore((s) => s.clearRecent);

  const styles = useMemo(() => buildStyles(colors, isDark), [colors, isDark]);

  const themeOptions: { value: ThemeMode; label: string }[] = useMemo(
    () => [
      { value: 'system', label: t('settings.themeSystem') },
      { value: 'light',  label: t('settings.themeLight') },
      { value: 'dark',   label: t('settings.themeDark') },
    ],
    [t]
  );

  const handleClearRecent = useCallback(() => {
    Alert.alert(
      t('settings.clearRecentConfirmTitle'),
      t('settings.clearRecentConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clearRecentConfirm'),
          style: 'destructive',
          onPress: async () => {
            await clearRecent();
            Alert.alert('', t('settings.clearRecentDone'));
          },
        },
      ]
    );
  }, [clearRecent, t]);

  const handleOpenGitHub = useCallback(() => {
    Linking.openURL(GITHUB_URL).catch(() => {});
  }, []);

  const HOME_SECTION_CONFIG: { id: HomeSectionId; icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string; i18nKey: string }[] = useMemo(
    () => [
      { id: 'featuredBanner', icon: 'image-outline', iconColor: '#FF9F0A', i18nKey: 'settings.showFeaturedBanner' },
      { id: 'quickPicks', icon: 'time-outline', iconColor: '#30D158', i18nKey: 'settings.showQuickPicks' },
      { id: 'topCharts', icon: 'stats-chart-outline', iconColor: '#0A84FF', i18nKey: 'settings.showTopCharts' },
      { id: 'trendingNow', icon: 'flame-outline', iconColor: '#FF453A', i18nKey: 'settings.showTrendingNow' },
      { id: 'loveSongs', icon: 'heart-outline', iconColor: '#FF375F', i18nKey: 'settings.showLoveSongs' },
      { id: 'punjabiHits', icon: 'musical-notes-outline', iconColor: '#BF5AF2', i18nKey: 'settings.showPunjabiHits' },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.ambientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section label={t('settings.appearance')} styles={styles}>
          <Row
            icon="color-palette-outline"
            iconColor={colors.accent}
            label={t('settings.theme')}
            colors={colors}
            styles={styles}
          />
          <View style={styles.pickerPad}>
            <SegmentedControl
              options={themeOptions}
              selected={themeMode}
              onSelect={(mode) => void setThemeMode(mode)}
              colors={colors}
              isDark={isDark}
              styles={styles}
            />
          </View>
        </Section>

        <Section label={t('settings.data')} styles={styles}>
          <Row
            icon="trash-outline"
            iconColor="#FF453A"
            label={t('settings.clearRecent')}
            sublabel={t('settings.clearRecentDesc')}
            onPress={handleClearRecent}
            destructive
            colors={colors}
            styles={styles}
          />
        </Section>

        <Section label={t('settings.homeScreen')} styles={styles}>
          {HOME_SECTION_CONFIG.map((cfg, i) => (
            <React.Fragment key={cfg.id}>
              {i > 0 ? <Divider colors={colors} /> : null}
              <ToggleRow
                icon={cfg.icon}
                iconColor={cfg.iconColor}
                label={t(cfg.i18nKey)}
                value={homeSections[cfg.id]}
                onValueChange={(v) => void setHomeSection(cfg.id, v)}
                colors={colors}
                styles={styles}
                isDark={isDark}
              />
            </React.Fragment>
          ))}
        </Section>

        <Section label={t('settings.about')} styles={styles}>
          <Row
            icon="information-circle-outline"
            iconColor={colors.accent}
            label={t('settings.version')}
            value={APP_VERSION}
            colors={colors}
            styles={styles}
          />
          <Divider colors={colors} />
          <Row
            icon="logo-github"
            iconColor={colors.text}
            label={t('settings.sourceCode')}
            sublabel={t('settings.sourceCodeDesc')}
            onPress={handleOpenGitHub}
            colors={colors}
            styles={styles}
          />
          <Divider colors={colors} />
          <Row
            icon="document-text-outline"
            iconColor="#FF9F0A"
            label={t('settings.license')}
            value={t('settings.licenseDesc')}
            colors={colors}
            styles={styles}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

import { LIMITS, type ReportInput } from '@lokky/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconButton, Text, TextArea, useToast } from '@/ui';
import { createReport } from '../api';

type Target = ReportInput['targetType'];
type Reason = ReportInput['reason'];
const REASONS: readonly Reason[] = [
  'harassment',
  'inappropriate',
  'fake',
  'dangerous',
  'spam',
  'other',
];

// Signaler (spec §6.2, sheet) : un profil, une sortie ou un message. Ouvert en modal depuis
// n'importe quel écran (/report?targetType=…&targetId=…).
export function ReportScreen({ targetType, targetId }: { targetType: Target; targetId: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const report = useMutation({ mutationFn: (input: ReportInput) => createReport(input) });

  // « Autre » : quelques mots obligatoires, pour que l'équipe comprenne de quoi il s'agit.
  const needsDetails = reason === 'other';
  const detailsMissing = needsDetails && details.trim().length < LIMITS.report.detailsMin;

  const submit = () => {
    if (!reason || detailsMissing) return;
    report.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          toast.show(t('report.done'), 'success');
          router.back();
        },
        onError: () => toast.show(t('report.error'), 'error'),
      },
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header" style={styles.title}>
          {t('report.title')}
        </Text>
        <IconButton
          accessibilityLabel={t('common.close')}
          onPress={() => router.back()}
          icon={<X size={24} color={colors.text} weight="bold" />}
        />
      </View>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text color="textMuted">
            {t('report.body', { target: t(`report.targets.${targetType}`) })}
          </Text>
          <View accessibilityRole="radiogroup" style={styles.reasons}>
            {REASONS.map((r) => (
              <Pressable
                key={r}
                accessibilityRole="radio"
                accessibilityState={{ checked: reason === r }}
                onPress={() => setReason(r)}
                style={[styles.reason, reason === r && styles.reasonSelected]}
              >
                <View style={[styles.dot, reason === r && styles.dotSelected]} />
                <Text variant="bodyStrong" style={styles.flex}>
                  {t(`report.reasons.${r}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {reason ? (
            <TextArea
              label={needsDetails ? t('report.details') : t('report.detailsOptional')}
              placeholder={t('report.detailsPlaceholder')}
              value={details}
              onChangeText={setDetails}
              maxLength={LIMITS.report.detailsMax}
              hint={
                needsDetails
                  ? t('report.detailsError', { count: LIMITS.report.detailsMin })
                  : undefined
              }
            />
          ) : null}
          <Text variant="caption" color="textMuted">
            {t('report.safety')}
          </Text>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button
            label={t('report.submit')}
            variant="danger"
            size="lg"
            fullWidth
            disabled={!reason || detailsMissing}
            loading={report.isPending}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  flex: { flex: 1 },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: t.spacing.screen,
    paddingRight: t.spacing.sm,
  },
  title: { flex: 1 },
  content: { padding: t.spacing.screen, gap: t.spacing.lg },
  reasons: { gap: t.spacing.sm },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    minHeight: 52,
    paddingHorizontal: t.spacing.lg,
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  reasonSelected: { borderColor: t.colors.action },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: t.colors.border,
  },
  dotSelected: { borderColor: t.colors.action, borderWidth: 6 },
  footer: {
    paddingHorizontal: t.spacing.screen,
    paddingTop: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
}));

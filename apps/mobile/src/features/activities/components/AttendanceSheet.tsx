import type { Activity } from '@lokky/shared';
import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
// Circle n'exporte que CircleIcon (pas d'alias court, contrairement aux autres icônes).
import { CircleIcon as Circle } from 'phosphor-react-native/src/icons/Circle';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Avatar, Button, Skeleton, Sheet, Text, useToast } from '@/ui';
import { useParticipants } from '../hooks/useActivity';
import { useAttendance } from '../hooks/useAfterActivity';

// Le créateur indique qui est venu (spec §7.1) : tout le monde est coché par défaut, on
// décoche les absents. C'est ce qui calcule le taux de présence affiché sur les profils.
export function AttendanceSheet({
  activity,
  visible,
  onClose,
}: {
  activity: Activity;
  visible: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const participants = useParticipants(activity.id);
  const attendance = useAttendance();
  const [absent, setAbsent] = useState<ReadonlySet<string>>(new Set());
  const others = (participants.data ?? []).filter((p) => p.id !== activity.creator.id);

  const toggle = (id: string) =>
    setAbsent((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () =>
    attendance.mutate(
      {
        activityId: activity.id,
        attendance: others.map((p) => ({ userId: p.id, attended: !absent.has(p.id) })),
      },
      {
        onSuccess: () => {
          toast.show(t('attendance.done'), 'success');
          onClose();
        },
        onError: () => toast.show(t('attendance.error'), 'error'),
      },
    );

  return (
    <Sheet visible={visible} onClose={onClose} title={t('attendance.title')}>
      <Text color="textMuted">{t('attendance.body')}</Text>
      {participants.isPending ? (
        <Skeleton height={120} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {others.map((p) => {
            const present = !absent.has(p.id);
            return (
              <Pressable
                key={p.id}
                accessibilityRole="checkbox"
                accessibilityLabel={p.firstName}
                accessibilityState={{ checked: present }}
                onPress={() => toggle(p.id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Avatar name={p.firstName} uri={p.avatarUrl} size="md" />
                <View style={styles.name}>
                  <Text variant="bodyStrong">{p.firstName}</Text>
                  <Text variant="caption" color={present ? 'success' : 'textMuted'}>
                    {present ? t('attendance.present') : t('attendance.absent')}
                  </Text>
                </View>
                {present ? (
                  <CheckCircle size={28} color={colors.success} weight="fill" />
                ) : (
                  <Circle size={28} color={colors.border} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <Button
        label={t('attendance.submit')}
        fullWidth
        size="lg"
        disabled={others.length === 0}
        loading={attendance.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  list: { maxHeight: 320 },
  listContent: { gap: t.spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.md,
  },
  pressed: { backgroundColor: t.colors.surfaceMuted },
  name: { flex: 1 },
}));

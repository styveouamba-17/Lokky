import type { Activity } from '@lokky/shared';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { UserCheck } from 'phosphor-react-native/src/icons/UserCheck';
import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';
import { Button } from '@/ui';
import { AttendanceSheet } from './AttendanceSheet';
import { ReviewSheet } from './ReviewSheet';

// Ce qu'il reste à faire après une sortie : noter le créateur, ou indiquer qui est venu.
export function AfterActivityActions({
  activity,
  size = 'md',
}: {
  activity: Activity;
  size?: 'md' | 'lg';
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState<'review' | 'attendance' | null>(null);
  const { canReview, canDeclareAttendance } = activity.viewerState;
  if (!canReview && !canDeclareAttendance && open === null) return null;

  return (
    <>
      {canReview ? (
        <Button
          label={t('review.cta')}
          size={size}
          fullWidth
          icon={<Star size={20} color={colors.onAction} weight="fill" />}
          onPress={() => setOpen('review')}
        />
      ) : null}
      {canDeclareAttendance ? (
        <Button
          label={t('attendance.cta')}
          size={size}
          fullWidth
          icon={<UserCheck size={20} color={colors.onAction} weight="bold" />}
          onPress={() => setOpen('attendance')}
        />
      ) : null}
      {/* Montées tant qu'elles sont ouvertes : le remerciement reste visible après l'envoi. */}
      <ReviewSheet activity={activity} visible={open === 'review'} onClose={() => setOpen(null)} />
      {canDeclareAttendance || open === 'attendance' ? (
        <AttendanceSheet
          activity={activity}
          visible={open === 'attendance'}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

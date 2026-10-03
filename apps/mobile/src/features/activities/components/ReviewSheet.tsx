import { LIMITS, type Activity } from '@lokky/shared';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconDisc, Illustration, Sheet, Text, TextArea, useToast } from '@/ui';
import { useReview } from '../hooks/useAfterActivity';

const STARS = [1, 2, 3, 4, 5] as const;

// Laisser un avis (spec §6.2, sheet) : une note pour le créateur, un mot facultatif.
export function ReviewSheet({
  activity,
  visible,
  onClose,
}: {
  activity: Activity;
  visible: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const toast = useToast();
  const review = useReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const name = activity.creator.firstName;

  const close = () => {
    onClose();
    // Après remerciement, la feuille repart à zéro (la sortie n'est de toute façon plus notable).
    if (review.isSuccess) review.reset();
  };

  const submit = () =>
    review.mutate(
      { activityId: activity.id, creatorRating: rating, comment: comment.trim() || undefined },
      { onError: () => toast.show(t('review.error'), 'error') },
    );

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={review.isSuccess ? undefined : t('review.title')}
    >
      {review.isSuccess ? (
        <View style={styles.thanks}>
          <Illustration
            name="review-thanks"
            fallback={<IconDisc icon={Star} />}
            style={styles.artwork}
          />
          <Text variant="heading" align="center" accessibilityRole="header">
            {t('review.thanksTitle')}
          </Text>
          <Text color="textMuted" align="center">
            {t('review.thanksBody')}
          </Text>
          <Button label={t('common.close')} fullWidth onPress={close} />
        </View>
      ) : (
        <>
          <Text color="textMuted">{t('review.body', { name })}</Text>
          <StarRating value={rating} onChange={setRating} />
          <TextArea
            label={t('review.comment', { name })}
            placeholder={t('review.commentPlaceholder')}
            value={comment}
            onChangeText={setComment}
            maxLength={LIMITS.review.commentMax}
          />
          <Button
            label={t('review.submit')}
            fullWidth
            size="lg"
            disabled={rating === 0}
            loading={review.isPending}
            onPress={submit}
          />
        </>
      )}
    </Sheet>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.rating}>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('review.ratingLabel')}
        style={styles.stars}
      >
        {STARS.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityLabel={t('review.star', { count: n })}
            accessibilityState={{ checked: value === n }}
            onPress={() => onChange(n)}
            hitSlop={4}
            style={styles.star}
          >
            <Star
              size={40}
              color={n <= value ? colors.accent : colors.border}
              weight={n <= value ? 'fill' : 'regular'}
            />
          </Pressable>
        ))}
      </View>
      <Text variant="label" color={value ? 'text' : 'textMuted'} align="center">
        {value ? t(`review.ratingHints.${value as 1 | 2 | 3 | 4 | 5}`) : ' '}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  rating: { gap: t.spacing.xs },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.sm },
  star: { padding: t.spacing.xs },
  thanks: { alignItems: 'center', gap: t.spacing.md, paddingTop: t.spacing.md },
  artwork: { maxWidth: 220 },
}));

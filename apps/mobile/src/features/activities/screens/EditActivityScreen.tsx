import {
  ACTIVITY_EDIT_LOCK_MINUTES,
  haversineKm,
  LIMITS,
  makeCreateActivityInputSchema,
  NEIGHBORHOODS,
  NEIGHBORHOOD_IDS,
  POPULAR_PLACES,
  type Activity,
  type UpdateActivityInput,
} from '@lokky/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { X } from 'phosphor-react-native/src/icons/X';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { useSessionStore } from '@/state/session';
import { makeStyles, useTheme } from '@/theme';
import {
  Button,
  EmptyState,
  IconButton,
  ScreenHeader,
  Skeleton,
  Stepper,
  Text,
  useToast,
} from '@/ui';
import { useActivity } from '../hooks/useActivity';
import { useUpdateActivity } from '../hooks/useManageActivity';
import { StepCost } from '../create/components/StepCost';
import { StepCount } from '../create/components/StepCount';
import { StepReview } from '../create/components/StepReview';
import { StepWhat } from '../create/components/StepWhat';
import { StepWhen } from '../create/components/StepWhen';
import { StepWhere } from '../create/components/StepWhere';
import { draftSchema, isoDay, STEP_FIELDS, toCreateInput, type Draft } from '../create/draft';

export function EditActivityScreen({ id }: { id: string }) {
  const styles = useStyles();
  const { t } = useTranslation();
  const activity = useActivity(id);

  if (activity.isPending) {
    return (
      <View style={styles.screen}>
        <View style={styles.content}>
          <Skeleton height={32} width="70%" />
          <Skeleton height={220} />
        </View>
      </View>
    );
  }
  if (
    activity.isError ||
    !activity.data.viewerState.isCreator ||
    activity.data.status !== 'upcoming'
  ) {
    return (
      <View style={[styles.screen, styles.center]}>
        <EmptyState
          artwork="activity-gone"
          title={t('editActivity.unavailable')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  return <EditActivityForm activity={activity.data} />;
}

function EditActivityForm({ activity }: { activity: Activity }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useToast();
  const me = useSessionStore((s) => s.me);
  const update = useUpdateActivity();
  const [now] = useState(() => new Date());
  const initial = draftFromActivity(activity);
  const hasJoinedParticipants = activity.participantCount > 1;
  const scheduleLocked =
    new Date(activity.startsAt).getTime() - now.getTime() < ACTIVITY_EDIT_LOCK_MINUTES * 60_000;
  const restricted = hasJoinedParticipants;
  const steps = !hasJoinedParticipants
    ? [0, 1, 2, 3, 4, 5]
    : scheduleLocked
      ? [0, 2, 5]
      : [0, 1, 2, 3, 5];
  const [step, setStep] = useState(0);
  const { control, trigger, handleSubmit, formState } = useForm<Draft>({
    resolver: zodResolver(draftSchema),
    defaultValues: initial,
  });
  const values = useWatch({ control });
  const activeStep = steps[step]!;
  const isLast = step === steps.length - 1;

  const close = () => {
    if (!formState.isDirty) return router.back();
    Alert.alert(t('editActivity.discardTitle'), t('editActivity.discardBody'), [
      { text: t('editActivity.keep'), style: 'cancel' },
      { text: t('editActivity.discard'), style: 'destructive', onPress: () => router.back() },
    ]);
  };
  const submit = handleSubmit((draft) => {
    const input = updateInput(activity, initial, draft);
    if (input.startsAt !== undefined) {
      const parsed = makeCreateActivityInputSchema().safeParse(toCreateInput(draft));
      if (
        !parsed.success ||
        (hasJoinedParticipants &&
          new Date(input.startsAt).getTime() - Date.now() < ACTIVITY_EDIT_LOCK_MINUTES * 60_000)
      ) {
        toast.show(t('editActivity.errors.startsAt'), 'error');
        setStep(steps.indexOf(1));
        return;
      }
    }
    update.mutate(input, {
      onSuccess: () => {
        toast.show(t('editActivity.saved'), 'success');
        router.back();
      },
      onError: () => toast.show(t('editActivity.errors.generic'), 'error'),
    });
  });
  const next = async () => {
    if (isLast) return submit();
    if (await trigger(STEP_FIELDS[activeStep]!)) setStep(step + 1);
  };

  const filled =
    activeStep === 0 && restricted
      ? true
      : [
          !!values.category && (values.title ?? '').trim().length >= LIMITS.activity.titleMin,
          !!values.day && !!values.time,
          (values.placeName ?? '').trim().length >= 2 &&
            (!!values.placeId || !!values.neighborhood),
          true,
          true,
          true,
        ][activeStep];

  const preview = (() => {
    if (!isLast || !me) return null;
    const parsed = draftSchema.safeParse(values);
    if (!parsed.success) return null;
    const input = toCreateInput(parsed.data);
    const location = updatedLocation(activity, initial, parsed.data);
    return {
      ...activity,
      title: input.title,
      category: input.category,
      description: input.description ?? '',
      startsAt: input.startsAt,
      location,
      capacity: input.capacity,
      cost: input.cost,
    };
  })();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader
        title={t('editActivity.title')}
        onBack={close}
        right={
          <IconButton
            accessibilityLabel={t('common.close')}
            onPress={close}
            icon={<X size={24} color={colors.text} weight="bold" />}
          />
        }
      />
      <View style={styles.progress}>
        <Stepper step={step + 1} total={steps.length} />
      </View>
      {restricted ? (
        <View style={styles.notice}>
          <Text color="textMuted">
            {t(scheduleLocked ? 'editActivity.scheduleLockedNotice' : 'editActivity.limitedNotice')}
          </Text>
        </View>
      ) : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {activeStep === 0 ? (
            <StepWhat control={control} errors={formState.errors} detailsOnly={restricted} />
          ) : null}
          {activeStep === 1 ? (
            <StepWhen control={control} now={now} dayCount={LIMITS.activity.maxAheadDays + 1} />
          ) : null}
          {activeStep === 2 ? (
            <StepWhere control={control} errors={formState.errors} meetingPointOnly={restricted} />
          ) : null}
          {activeStep === 3 ? <StepCount control={control} /> : null}
          {activeStep === 4 ? <StepCost control={control} errors={formState.errors} /> : null}
          {preview ? (
            <StepReview
              activity={preview}
              now={now}
              onEdit={(index) => setStep(steps.indexOf(index))}
              editableSteps={
                hasJoinedParticipants ? (scheduleLocked ? [2] : [1, 2, 3]) : [1, 2, 3, 4]
              }
            />
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button
            label={isLast ? t('editActivity.save') : t('common.continue')}
            size="lg"
            fullWidth
            disabled={!filled}
            loading={update.isPending}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function draftFromActivity(activity: Activity): Draft {
  const coordinates = activity.location.coordinates;
  const placeId =
    POPULAR_PLACES.find(
      (place) =>
        place.name === activity.location.name &&
        place.neighborhood === activity.location.neighborhood &&
        place.coordinates.lat === coordinates.lat &&
        place.coordinates.lng === coordinates.lng,
    )?.id ?? null;
  const neighborhood =
    activity.location.neighborhood ??
    NEIGHBORHOOD_IDS.reduce(
      (closest, id) =>
        haversineKm(coordinates, NEIGHBORHOODS[id].coordinates) <
        haversineKm(coordinates, NEIGHBORHOODS[closest].coordinates)
          ? id
          : closest,
      NEIGHBORHOOD_IDS[0]!,
    );
  const startsAt = new Date(activity.startsAt);
  return {
    category: activity.category,
    title: activity.title,
    description: activity.description,
    day: isoDay(startsAt),
    time: `${String(startsAt.getUTCHours()).padStart(2, '0')}:${String(startsAt.getUTCMinutes()).padStart(2, '0')}`,
    placeId,
    placeName: activity.location.name,
    neighborhood,
    meetingPoint: activity.location.meetingPoint ?? '',
    capacity: activity.capacity,
    costType: activity.cost.type,
    estimate:
      activity.cost.type === 'split' && activity.cost.estimateFcfa !== undefined
        ? String(activity.cost.estimateFcfa)
        : '',
  };
}

function updatedLocation(activity: Activity, initial: Draft, draft: Draft) {
  const converted = toCreateInput(draft).location;
  const placeUnchanged =
    draft.placeId === initial.placeId &&
    draft.placeName === activity.location.name &&
    draft.neighborhood === initial.neighborhood;
  return placeUnchanged
    ? { ...activity.location, meetingPoint: converted.meetingPoint }
    : converted;
}

function updateInput(activity: Activity, initial: Draft, draft: Draft): UpdateActivityInput {
  const converted = toCreateInput(draft);
  const location = updatedLocation(activity, initial, draft);
  const input: UpdateActivityInput = { id: activity.id };
  if (draft.title !== initial.title) input.title = converted.title;
  if (draft.category !== initial.category) input.category = converted.category;
  if (draft.description !== initial.description) input.description = converted.description;
  if (converted.startsAt !== activity.startsAt) input.startsAt = converted.startsAt;
  if (converted.capacity !== activity.capacity) input.capacity = converted.capacity;
  if (JSON.stringify(converted.cost) !== JSON.stringify(activity.cost)) input.cost = converted.cost;
  if (
    location.name !== activity.location.name ||
    location.coordinates.lat !== activity.location.coordinates.lat ||
    location.coordinates.lng !== activity.location.coordinates.lng ||
    location.neighborhood !== activity.location.neighborhood ||
    location.meetingPoint !== activity.location.meetingPoint
  ) {
    input.location = location;
  }
  return input;
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  center: { justifyContent: 'center' },
  flex: { flex: 1 },
  progress: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.sm },
  notice: { paddingHorizontal: t.spacing.screen, paddingBottom: t.spacing.sm },
  content: { padding: t.spacing.screen, paddingBottom: t.spacing.xxxl },
  footer: { paddingHorizontal: t.spacing.screen, paddingVertical: t.spacing.md },
}));

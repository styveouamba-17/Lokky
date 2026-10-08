import type { Activity, User } from '@lokky/shared';
import { router } from 'expo-router';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { Alert, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconButton, Sheet, Skeleton, Text, useToast } from '@/ui';
import {
  useCancelGroupActivity,
  useGroupParticipants,
  useRemoveGroupParticipant,
} from '../hooks/useOrganizerTools';

export function GroupOrganizerTools({
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
  const participants = useGroupParticipants(activity.id);
  const remove = useRemoveGroupParticipant();
  const cancel = useCancelGroupActivity();

  const confirmRemove = (person: User) =>
    Alert.alert(
      t('chat.organizer.removeTitle'),
      t('chat.organizer.removeBody', { name: person.firstName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('chat.organizer.removeConfirm'),
          style: 'destructive',
          onPress: () =>
            remove.mutate(
              { activityId: activity.id, userId: person.id },
              {
                onSuccess: () => toast.show(t('chat.organizer.removed'), 'success'),
                onError: () => toast.show(t('chat.organizer.error'), 'error'),
              },
            ),
        },
      ],
    );

  return (
    <Sheet visible={visible} onClose={onClose} title={t('chat.organizer.title')}>
      <View style={styles.content}>
        <View style={styles.actions}>
          <Button
            label={t('chat.organizer.edit')}
            variant="secondary"
            fullWidth
            onPress={() => {
              onClose();
              router.push({ pathname: '/activity/[id]/edit', params: { id: activity.id } });
            }}
          />
          <Button
            label={t('chat.organizer.cancel')}
            variant="danger"
            fullWidth
            loading={cancel.isPending}
            onPress={() =>
              Alert.alert(t('chat.organizer.cancelTitle'), t('chat.organizer.cancelBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('chat.organizer.cancelConfirm'),
                  style: 'destructive',
                  onPress: () =>
                    cancel.mutate(activity.id, {
                      onSuccess: () => {
                        toast.show(t('chat.organizer.cancelled'), 'success');
                        onClose();
                      },
                      onError: () => toast.show(t('chat.organizer.error'), 'error'),
                    }),
                },
              ])
            }
          />
        </View>
        <Text variant="label">{t('chat.organizer.participants')}</Text>
        {participants.isPending ? <Skeleton height={44} /> : null}
        {participants.isError ? (
          <Text variant="caption" color="danger">
            {t('chat.organizer.participantsError')}
          </Text>
        ) : null}
        {participants.data
          ?.filter((person) => person.id !== activity.creator.id)
          .map((person) => (
            <View key={person.id} style={styles.person}>
              <Text style={styles.name}>{person.firstName}</Text>
              <IconButton
                accessibilityLabel={t('chat.organizer.remove', { name: person.firstName })}
                disabled={remove.isPending}
                onPress={() => confirmRemove(person)}
                icon={<Trash size={20} color={colors.danger} weight="bold" />}
              />
            </View>
          ))}
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((t) => ({
  content: { gap: t.spacing.md },
  actions: { gap: t.spacing.sm },
  person: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  name: { flex: 1 },
}));

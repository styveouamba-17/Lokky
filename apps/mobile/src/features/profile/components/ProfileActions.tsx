import type { UserProfile } from '@lokky/shared';
import { router } from 'expo-router';
import { ChatCircleDots } from 'phosphor-react-native/src/icons/ChatCircleDots';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { Flag } from 'phosphor-react-native/src/icons/Flag';
import { LockSimple } from 'phosphor-react-native/src/icons/LockSimple';
import { Prohibit } from 'phosphor-react-native/src/icons/Prohibit';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { Button, IconButton, IconDisc, Illustration, Sheet, Text, useToast } from '@/ui';
import { useBlock, useOpenDirect } from '../hooks/useRelationship';

type Open = 'menu' | 'confirmBlock' | 'dmLocked' | null;

// Bouton « … » de l'en-tête : signaler, bloquer ou débloquer (spec §2, principe 4).
export function ProfileMenuButton({ onOpen }: { onOpen: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <IconButton
      accessibilityLabel={t('profile.more')}
      onPress={onOpen}
      icon={<DotsThree size={28} color={colors.text} weight="bold" />}
    />
  );
}

// « Écrire » et les feuilles d'actions du profil public.
export function useProfileActions(user: UserProfile) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const direct = useOpenDirect();
  const block = useBlock();
  const name = user.firstName;
  const close = () => setOpen(null);

  const write = () => {
    if (!user.relationship.canMessage) return setOpen('dmLocked');
    direct.mutate(user.id, {
      onSuccess: (conversation) =>
        router.push({ pathname: '/chat/[id]', params: { id: conversation.id } }),
      onError: () => toast.show(t('profile.error'), 'error'),
    });
  };

  const setBlocked = (value: boolean) =>
    block.mutate(
      { userId: user.id, block: value },
      {
        onSuccess: () => {
          close();
          toast.show(t(value ? 'profile.blocked' : 'profile.unblocked', { name }), 'success');
        },
        onError: () => toast.show(t('profile.error'), 'error'),
      },
    );

  const report = () => {
    close();
    router.push({ pathname: '/report', params: { targetType: 'user', targetId: user.id } });
  };

  const messageButton = user.relationship.isBlocked ? null : (
    <Button
      label={t('profile.message')}
      variant={user.relationship.canMessage ? 'primary' : 'secondary'}
      fullWidth
      loading={direct.isPending}
      icon={
        user.relationship.canMessage ? (
          <ChatCircleDots size={20} color={colors.onAction} weight="fill" />
        ) : (
          <LockSimple size={20} color={colors.action} weight="bold" />
        )
      }
      onPress={write}
    />
  );

  const sheets = (
    <>
      <Sheet visible={open === 'menu'} onClose={close}>
        <View style={styles.menu}>
          <Button
            label={t('profile.report')}
            variant="ghost"
            fullWidth
            icon={<Flag size={20} color={colors.action} weight="bold" />}
            onPress={report}
          />
          {user.relationship.isBlocked ? (
            <Button
              label={t('profile.unblock')}
              variant="secondary"
              fullWidth
              loading={block.isPending}
              onPress={() => setBlocked(false)}
            />
          ) : (
            <Button
              label={t('profile.block')}
              variant="danger"
              fullWidth
              icon={<Prohibit size={20} color={colors.onAction} weight="bold" />}
              onPress={() => setOpen('confirmBlock')}
            />
          )}
        </View>
      </Sheet>

      <Sheet
        visible={open === 'confirmBlock'}
        onClose={close}
        title={t('profile.blockTitle', { name })}
      >
        <Text color="textMuted">{t('profile.blockBody', { name })}</Text>
        <Button
          label={t('profile.block')}
          variant="danger"
          size="lg"
          fullWidth
          loading={block.isPending}
          onPress={() => setBlocked(true)}
        />
      </Sheet>

      <Sheet visible={open === 'dmLocked'} onClose={close}>
        <View style={styles.locked}>
          <Illustration
            name="dm-locked"
            fallback={<IconDisc icon={LockSimple} />}
            style={styles.artwork}
          />
          <Text variant="heading" align="center" accessibilityRole="header">
            {t('profile.dmLockedTitle')}
          </Text>
          <Text color="textMuted" align="center">
            {t('profile.dmLockedBody', { name })}
          </Text>
          <Button
            label={t('profile.dmLockedAction')}
            fullWidth
            onPress={() => {
              close();
              router.navigate('/discover');
            }}
          />
        </View>
      </Sheet>
    </>
  );

  return { openMenu: () => setOpen('menu'), messageButton, sheets };
}

const useStyles = makeStyles((t) => ({
  menu: { gap: t.spacing.sm },
  locked: { alignItems: 'center', gap: t.spacing.md },
  artwork: { maxWidth: 220 },
}));

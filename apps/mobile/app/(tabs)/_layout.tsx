import { router, Tabs } from 'expo-router';
import { CalendarCheck } from 'phosphor-react-native/src/icons/CalendarCheck';
import { ChatsCircle } from 'phosphor-react-native/src/icons/ChatsCircle';
import { Compass } from 'phosphor-react-native/src/icons/Compass';
import { UserCircle } from 'phosphor-react-native/src/icons/UserCircle';
import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import { useActivityRealtime } from '@/features/activities/hooks/useActivityRealtime';
import { useOpenPendingLink } from '@/features/activities/hooks/useOpenPendingLink';
import { useChatRealtime } from '@/features/chat/hooks/useChatRealtime';
import { useUnreadTotal } from '@/features/chat/hooks/useConversations';
import { WarningSheet } from '@/features/moderation/components/WarningSheet';
import { useModerationRealtime } from '@/features/moderation/hooks/useModerationRealtime';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { useTranslation } from '@/i18n';
import { fontFamilies, useTheme } from '@/theme';
import { CreateButton } from '@/ui';

type Icon = ComponentType<{ size?: number; color?: string; weight?: 'regular' | 'fill' }>;
// La teinte vient de tabBarActive/InactiveTintColor : toujours une chaîne issue des tokens.
const tabIcon = (Glyph: Icon) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Glyph size={26} color={color as string} weight={focused ? 'fill' : 'regular'} />;
  };

// Découvrir · Mes activités · [+] Créer · Messages · Profil (spec §6.2).
// Les onglets restent montés tant que l'utilisateur est connecté : le temps réel vit ici.
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  useChatRealtime();
  useModerationRealtime();
  useActivityRealtime();
  usePushNotifications();
  useOpenPendingLink();
  const unread = useUnreadTotal();
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.action,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontFamily: fontFamilies.interSemiBold, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="discover"
          options={{ title: t('tabs.discover'), tabBarIcon: tabIcon(Compass) }}
        />
        <Tabs.Screen
          name="mine"
          options={{ title: t('tabs.mine'), tabBarIcon: tabIcon(CalendarCheck) }}
        />
        <Tabs.Screen
          name="new"
          options={{
            title: t('tabs.create'),
            tabBarButton: () => (
              <CreateButton
                accessibilityLabel={t('tabs.create')}
                onPress={() => router.push('/create')}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabs.messages'),
            tabBarIcon: tabIcon(ChatsCircle),
            tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.action, color: colors.onAction },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('tabs.profile'), tabBarIcon: tabIcon(UserCircle) }}
        />
      </Tabs>
      <WarningSheet />
    </>
  );
}

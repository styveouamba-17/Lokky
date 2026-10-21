import type { ActivityCategory } from '@lokky/shared';
import { Image } from 'expo-image';
import { activityCover, AVATAR_SIZES, Avatar, type AvatarSize } from '@/ui';

export function ActivityGroupAvatar({
  activityId,
  category,
  cover,
  name,
  size,
}: {
  activityId: string;
  category: ActivityCategory | null;
  cover?: string | null;
  name: string;
  size: AvatarSize;
}) {
  const image = category ? activityCover({ id: activityId, category, cover }) : null;
  if (!image) return <Avatar name={name} uri={null} size={size} />;

  const diameter = AVATAR_SIZES[size];
  return (
    <Image
      testID="activity-group-avatar"
      source={image.source}
      style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
      contentFit="cover"
      contentPosition={{ top: `${image.focusY}%`, left: '50%' }}
      transition={150}
      accessible
      accessibilityLabel={name}
    />
  );
}

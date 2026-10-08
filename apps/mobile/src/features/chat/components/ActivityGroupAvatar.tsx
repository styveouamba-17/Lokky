import type { ActivityCategory } from '@lokky/shared';
import { Image } from 'expo-image';
import { AVATAR_SIZES, Avatar, type AvatarSize, categoryCover } from '@/ui';

export function ActivityGroupAvatar({
  activityId,
  category,
  name,
  size,
}: {
  activityId: string;
  category: ActivityCategory | null;
  name: string;
  size: AvatarSize;
}) {
  const source = category ? categoryCover(category, activityId) : null;
  if (!source) return <Avatar name={name} uri={null} size={size} />;

  const diameter = AVATAR_SIZES[size];
  return (
    <Image
      testID="activity-group-avatar"
      source={source}
      style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
      contentFit="cover"
      transition={150}
      accessible
      accessibilityLabel={name}
    />
  );
}

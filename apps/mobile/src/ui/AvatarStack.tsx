import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { AVATAR_SIZES, Avatar, type AvatarSize } from './Avatar';
import { Text } from './Text';

export type StackPerson = { id: string; name: string; uri: string | null };

export function AvatarStack({
  people,
  total = people.length,
  max = 4,
  size = 'sm',
}: {
  people: StackPerson[];
  total?: number;
  max?: number;
  size?: AvatarSize;
}) {
  const styles = useStyles();
  const shown = people.slice(0, max);
  const overflow = Math.max(0, total - shown.length);
  const d = AVATAR_SIZES[size];

  return (
    <View
      accessible
      accessibilityLabel={`${total} participant${total > 1 ? 's' : ''}`}
      style={styles.row}
    >
      {shown.map((person, index) => (
        <View key={person.id} style={[styles.ring, index > 0 && { marginLeft: -d / 3 }]}>
          <Avatar name={person.name} uri={person.uri} size={size} />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={[
            styles.ring,
            styles.more,
            { width: d, height: d, borderRadius: d / 2, marginLeft: -d / 3 },
          ]}
        >
          <Text variant="caption" maxFontSizeMultiplier={1}>{`+${overflow}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderWidth: 2, borderColor: t.colors.surface, borderRadius: t.radius.full },
  more: { backgroundColor: t.colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
}));

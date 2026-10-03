import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Text } from './Text';

export function StepIntro({ title, body }: { title: string; body: string }) {
  const styles = useStyles();
  return (
    <View style={styles.intro}>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      <Text color="textMuted">{body}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({ intro: { gap: t.spacing.sm } }));

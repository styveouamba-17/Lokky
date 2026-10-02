import type { ReactNode } from 'react';
import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export function EmptyState({
  title,
  description,
  illustration,
  action,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      {illustration}
      <Text variant="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text color="textMuted" align="center">
          {description}
        </Text>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.md,
    padding: t.spacing.xxl,
  },
}));

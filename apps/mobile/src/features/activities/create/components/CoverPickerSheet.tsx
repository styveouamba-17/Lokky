import type { ActivityCategory, ActivityCover } from '@lokky/shared';
import { Image } from 'expo-image';
import { CheckCircle } from 'phosphor-react-native/src/icons/CheckCircle';
import { MagicWand } from 'phosphor-react-native/src/icons/MagicWand';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from '@/i18n';
import { makeStyles, useTheme } from '@/theme';
import { activityCover, coverChoices, coverImage, Sheet, Text, type CoverImage } from '@/ui';

// Galerie des couvertures (récapitulatif de création et modification) : « Automatique », puis
// les images pensées pour la catégorie, puis toutes les autres. Choisir referme la feuille.
export function CoverPickerSheet({
  visible,
  onClose,
  activityId,
  category,
  value,
  onChange,
}: {
  visible: boolean;
  onClose: () => void;
  activityId: string;
  category: ActivityCategory;
  value: ActivityCover | null;
  onChange: (cover: ActivityCover | null) => void;
}) {
  const styles = useStyles();
  const { t } = useTranslation();
  const { suggested, others } = coverChoices(category);
  const choose = (cover: ActivityCover | null) => {
    onChange(cover);
    onClose();
  };
  const tile = (id: ActivityCover) => (
    <CoverTile
      key={id}
      label={t(`create.cover.names.${id}`)}
      image={coverImage(id)}
      selected={value === id}
      onPress={() => choose(id)}
    />
  );

  return (
    <Sheet visible={visible} onClose={onClose} title={t('create.cover.title')}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text color="textMuted">{t('create.cover.body')}</Text>
        <Text variant="label">
          {t('create.cover.suggested', { category: t(`categories.${category}`) })}
        </Text>
        <View style={styles.grid}>
          <CoverTile
            label={t('create.cover.auto')}
            hint={t('create.cover.autoHint')}
            image={activityCover({ id: activityId, category, cover: null })}
            selected={value === null}
            onPress={() => choose(null)}
          />
          {suggested.map(tile)}
        </View>
        {others.length > 0 ? (
          <>
            <Text variant="label">{t('create.cover.others')}</Text>
            <View style={styles.grid}>{others.map(tile)}</View>
          </>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function CoverTile({
  label,
  hint,
  image,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  image: CoverImage | null;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? `${label}, ${t('create.cover.selected')}` : label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.frame, selected && styles.frameSelected]}>
        {image ? (
          <Image
            source={image.source}
            contentFit="cover"
            contentPosition={{ top: `${image.focusY}%`, left: '50%' }}
            accessible={false}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <MagicWand size={28} color={colors.textMuted} />
          </View>
        )}
        {selected ? (
          <View style={styles.check}>
            <CheckCircle size={26} color={colors.action} weight="fill" />
          </View>
        ) : null}
      </View>
      <Text variant="caption" numberOfLines={1}>
        {label}
      </Text>
      {hint ? (
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  scroll: { flexGrow: 0 },
  content: { gap: t.spacing.lg, paddingBottom: t.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  tile: { width: '47%', gap: t.spacing.xs },
  pressed: { opacity: 0.8 },
  frame: {
    borderRadius: t.radius.md,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  frameSelected: { borderColor: t.colors.action },
  image: { width: '100%', aspectRatio: 2 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surfaceMuted,
  },
  check: {
    position: 'absolute',
    top: t.spacing.xs,
    right: t.spacing.xs,
    borderRadius: t.radius.full,
    backgroundColor: t.colors.surface,
  },
}));

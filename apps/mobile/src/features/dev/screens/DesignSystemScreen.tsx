import { Heart } from 'phosphor-react-native/src/icons/Heart';
import { Moon } from 'phosphor-react-native/src/icons/Moon';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatActivityWhen, formatCost } from '@/lib';
import { usePreferencesStore } from '@/state/preferences';
import { makeStyles, useTheme, type ThemePreference } from '@/theme';
import {
  AvatarStack,
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  IconButton,
  Input,
  LokkyLogo,
  ScreenHeader,
  Sheet,
  Skeleton,
  Stepper,
  Text,
  TextArea,
  useToast,
  type ButtonVariant,
  type TextVariant,
} from '@/ui';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];
const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const TYPE_SCALE: TextVariant[] = [
  'display',
  'title',
  'heading',
  'body',
  'bodyStrong',
  'label',
  'caption',
];
const FILTERS = ['Ce soir', 'Ce week-end', 'Gratuit', 'Sport', 'Chill'];
const PEOPLE = ['Awa', 'Moussa', 'Fatou', 'Cheikh', 'Mariama', 'Ousmane'].map((name) => ({
  id: name,
  name,
  uri: null,
}));

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DesignSystemScreen() {
  const styles = useStyles();
  const theme = useTheme();
  const toast = useToast();
  const { themePreference, setThemePreference } = usePreferencesStore();
  const [filter, setFilter] = useState('Ce soir');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const now = new Date();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Design system" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          {THEMES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={themePreference === t.value}
              onPress={() => setThemePreference(t.value)}
            />
          ))}
        </View>

        <Section title="Logo">
          <LokkyLogo size={48} />
          <View style={styles.row}>
            <LokkyLogo variant="symbol" size={64} />
            <LokkyLogo variant="mono" size={48} />
            <LokkyLogo variant="symbol" size={48} />
            <LokkyLogo variant="symbol" size={24} simplified />
          </View>
        </Section>

        <Section title="Couleurs">
          <View style={styles.swatches}>
            {Object.entries(theme.colors).map(([name, value]) => (
              <View key={name} style={styles.swatch}>
                <View style={[styles.swatchColor, { backgroundColor: value }]} />
                <Text variant="caption" color="textMuted">
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Typographie">
          {TYPE_SCALE.map((variant) => (
            <Text key={variant} variant={variant}>
              {`${variant} · Tu fais quoi ce soir ?`}
            </Text>
          ))}
        </Section>

        <Section title="Boutons">
          {VARIANTS.map((variant) => (
            <Button
              key={variant}
              variant={variant}
              label={`Je viens ! (${variant})`}
              onPress={() => toast.show(variant)}
            />
          ))}
          <Button label="Chargement" loading onPress={() => {}} />
          <Button label="Désactivé" disabled onPress={() => {}} />
          <View style={styles.row}>
            <IconButton
              accessibilityLabel="J’aime"
              onPress={() => {}}
              icon={<Heart size={24} color={theme.colors.text} weight="fill" />}
            />
            <IconButton
              accessibilityLabel="Mode sombre"
              variant="filled"
              onPress={() => setThemePreference('dark')}
              icon={<Moon size={24} color={theme.colors.text} weight="fill" />}
            />
          </View>
        </Section>

        <Section title="Champs">
          <Input
            label="Titre de l’activité"
            placeholder="Foot à la plage"
            value={title}
            onChangeText={setTitle}
          />
          <Input
            label="Prénom"
            value="A"
            error="Ton prénom doit faire au moins 2 caractères."
            onChangeText={() => {}}
          />
          <TextArea
            label="Description"
            value={description}
            onChangeText={setDescription}
            maxLength={500}
          />
          <Stepper step={2} total={5} />
        </Section>

        <Section title="Puces et badges">
          <View style={styles.row}>
            {FILTERS.map((label) => (
              <Chip
                key={label}
                label={label}
                selected={filter === label}
                onPress={() => setFilter(label)}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Badge tone="free" label={formatCost({ type: 'free' })} />
            <Badge tone="split" label={formatCost({ type: 'split', estimateFcfa: 3000 })} />
            <Badge tone="trust" label="Créateur fiable" />
            <Badge tone="accent" label="Ce soir" />
          </View>
        </Section>

        <Section title="Avatars">
          <AvatarStack people={PEOPLE} total={9} max={4} />
          <AvatarStack people={PEOPLE} max={4} size="md" />
          <Card
            onPress={() => toast.show('Carte touchée', 'success')}
            accessibilityLabel="Foot à la plage"
          >
            <Text variant="bodyStrong">Foot à la plage</Text>
            <Text color="textMuted">
              {formatActivityWhen(new Date(now.getTime() + 3 * 3_600_000), now)}
            </Text>
            <AvatarStack people={PEOPLE.slice(0, 3)} total={6} />
          </Card>
        </Section>

        <Section title="États">
          <Skeleton height={20} />
          <Skeleton height={80} radius={theme.radius.lg} />
          <Divider />
          <EmptyState
            title="Aucune activité ce soir…"
            description="et si tu en créais une ?"
            action={{
              label: 'Créer une activité',
              onPress: () => toast.show('Nanu dem !', 'success'),
            }}
          />
          <Button
            variant="secondary"
            label="Afficher un toast d’erreur"
            onPress={() => toast.show('Activité complète', 'error')}
          />
          <Button
            variant="secondary"
            label="Ouvrir une feuille"
            onPress={() => setSheetOpen(true)}
          />
        </Section>
      </ScrollView>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Signaler">
        <Text color="textMuted">Exemple de feuille du bas.</Text>
        <Button label="Fermer" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.xxxl, paddingBottom: t.spacing.huge },
  section: { gap: t.spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  swatch: { width: 72, gap: t.spacing.xs },
  swatchColor: {
    height: 48,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
}));

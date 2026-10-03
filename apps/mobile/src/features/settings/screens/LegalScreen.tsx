import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { makeStyles } from '@/theme';
import { ScreenHeader, Text } from '@/ui';
import { currentLanguage } from '@/lib';
import { PRIVACY_EN } from '../legal/privacy.en';
import { PRIVACY_FR } from '../legal/privacy.fr';
import { TERMS_EN } from '../legal/terms.en';
import { TERMS_FR } from '../legal/terms.fr';
import type { LegalBlock, LegalDocument } from '../legal/types';

export const LEGAL_DOCUMENTS = {
  fr: { terms: TERMS_FR, privacy: PRIVACY_FR },
  en: { terms: TERMS_EN, privacy: PRIVACY_EN },
} as const;
export type LegalDocumentName = keyof typeof LEGAL_DOCUMENTS.fr;

// Conditions d'utilisation et confidentialité : lisibles hors ligne, avant comme après
// l'inscription (routes /legal/*, hors de la garde de session).
export function LegalScreen({ document }: { document: LegalDocumentName }) {
  const styles = useStyles();
  // useTranslation : l'écran se redessine si la langue change.
  useTranslation();
  const doc: LegalDocument = LEGAL_DOCUMENTS[currentLanguage()][document];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title={doc.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="caption" color="textMuted">
          {doc.updatedAt}
        </Text>
        <Text selectable>{doc.intro}</Text>
        {doc.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="heading" accessibilityRole="header">
              {section.title}
            </Text>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const styles = useStyles();
  if (typeof block === 'string') return <Text selectable>{block}</Text>;
  return (
    <View style={styles.list}>
      {block.map((item) => (
        <View key={item} style={styles.item}>
          <Text color="textMuted" accessibilityElementsHidden importantForAccessibility="no">
            •
          </Text>
          <Text selectable style={styles.itemText}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.bg },
  content: { padding: t.spacing.screen, gap: t.spacing.lg, paddingBottom: t.spacing.huge },
  section: { gap: t.spacing.sm, paddingTop: t.spacing.sm },
  list: { gap: t.spacing.xs },
  item: { flexDirection: 'row', gap: t.spacing.sm, paddingRight: t.spacing.sm },
  itemText: { flex: 1 },
}));

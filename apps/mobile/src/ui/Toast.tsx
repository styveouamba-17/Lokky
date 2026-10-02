import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, motion, spacing } from '@/theme';
import { Text } from './Text';

export type ToastTone = 'info' | 'success' | 'error';
interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({
  children,
  durationMs = 3500,
}: {
  children: ReactNode;
  durationMs?: number;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const nextId = useRef(0);
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), durationMs);
    return () => clearTimeout(timer);
  }, [toast, durationMs]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
  }, []);
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(motion.base)}
          exiting={FadeOutUp.duration(motion.fast)}
          pointerEvents="box-none"
          style={[styles.container, { top: insets.top + spacing.sm }]}
        >
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={styles.toast}
          >
            <View style={[styles.bar, styles[toast.tone]]} />
            <Text variant="bodyStrong" style={styles.message}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.');
  return api;
}

const useStyles = makeStyles((t) => ({
  container: {
    position: 'absolute',
    left: t.spacing.screen,
    right: t.spacing.screen,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    backgroundColor: t.colors.text, // fond inversé : sombre en clair, clair en sombre
    borderRadius: t.radius.md,
    paddingVertical: t.spacing.md,
    paddingHorizontal: t.spacing.lg,
  },
  message: { flex: 1, color: t.colors.bg },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  info: { backgroundColor: t.colors.brand },
  success: { backgroundColor: t.colors.success },
  error: { backgroundColor: t.colors.danger },
}));

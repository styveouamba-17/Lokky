import { act, renderHook } from '@testing-library/react-native';
import { realtime } from '@/api/client';
import { TYPING_IDLE_MS, TYPING_RESEND_MS, useTypingSignal } from '../hooks/useTypingSignal';

jest.mock('@/api/client', () => ({
  realtime: { emit: jest.fn(), isConnected: jest.fn(() => true) },
}));

const emit = jest.mocked(realtime.emit);
const isConnected = jest.mocked(realtime.isConnected);

describe('useTypingSignal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    isConnected.mockReturnValue(true);
  });
  afterEach(() => jest.useRealTimers());

  it('signale la saisie une fois, puis la relance au plus toutes les 3 s', async () => {
    const { result } = await renderHook(() => useTypingSignal('c1'));
    await act(() => result.current.onTextChange('S'));
    await act(() => result.current.onTextChange('Sa'));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('typing', { conversationId: 'c1', isTyping: true });

    await act(() => jest.advanceTimersByTime(TYPING_RESEND_MS));
    await act(() => result.current.onTextChange('Sal'));
    expect(emit).toHaveBeenCalledTimes(2);
  });

  it('arrête la saisie après un temps sans frappe', async () => {
    const { result } = await renderHook(() => useTypingSignal('c1'));
    await act(() => result.current.onTextChange('Salut'));
    await act(() => jest.advanceTimersByTime(TYPING_IDLE_MS));
    expect(emit).toHaveBeenLastCalledWith('typing', { conversationId: 'c1', isTyping: false });
  });

  it('arrête la saisie quand le champ est vidé, à l’envoi ou en quittant', async () => {
    const { result, unmount } = await renderHook(() => useTypingSignal('c1'));
    await act(() => result.current.onTextChange('Salut'));
    await act(() => result.current.onTextChange(''));
    expect(emit).toHaveBeenLastCalledWith('typing', { conversationId: 'c1', isTyping: false });

    await act(() => result.current.onTextChange('Re'));
    await act(() => result.current.stop());
    expect(emit).toHaveBeenLastCalledWith('typing', { conversationId: 'c1', isTyping: false });

    await act(() => result.current.onTextChange('Re'));
    emit.mockClear();
    await unmount();
    expect(emit).toHaveBeenCalledWith('typing', { conversationId: 'c1', isTyping: false });
  });

  it('n’envoie rien de plus si la saisie n’a jamais commencé', async () => {
    const { result, unmount } = await renderHook(() => useTypingSignal('c1'));
    await act(() => result.current.stop());
    await unmount();
    expect(emit).not.toHaveBeenCalled();
  });

  it('n’envoie rien hors connexion', async () => {
    isConnected.mockReturnValue(false);
    const { result } = await renderHook(() => useTypingSignal('c1'));
    await act(() => result.current.onTextChange('Salut'));
    await act(() => jest.advanceTimersByTime(TYPING_IDLE_MS));
    expect(emit).not.toHaveBeenCalled();
  });
});

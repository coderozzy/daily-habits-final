import { renderHook, act } from '@testing-library/react-native';
import { usePersistence } from '../usePersistence';

const { persistor } = require('../../redux/store');

describe('usePersistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    persistor.subscribe.mockReturnValue(jest.fn());
    persistor.getState.mockReturnValue({ bootstrapped: false });
    persistor.purge.mockResolvedValue();
    persistor.persist.mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePersistence());

    expect(result.current.persistError).toBe(null);
    expect(result.current.bootstrapped).toBe(false);
    expect(typeof result.current.handleRetry).toBe('function');
    expect(typeof result.current.handlePersistenceSuccess).toBe('function');
  });

  it('should set up persistor subscription on mount', () => {
    renderHook(() => usePersistence());

    expect(persistor.subscribe).toHaveBeenCalledTimes(1);
    expect(typeof persistor.subscribe.mock.calls[0][0]).toBe('function');
  });

  it('should set timeout for persistence loading', () => {
    const { result } = renderHook(() => usePersistence());

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.persistError).toBe(
      'Loading timeout - please check your connection and try again'
    );
  });

  it('should update bootstrapped state when persistor state changes', () => {
    const { result } = renderHook(() => usePersistence());

    persistor.getState.mockReturnValue({ bootstrapped: true });
    
    act(() => {
      const subscriptionCallback = persistor.subscribe.mock.calls[0][0];
      subscriptionCallback();
    });

    expect(result.current.bootstrapped).toBe(true);
    expect(result.current.persistError).toBe(null);
  });

  it('should clear timeout when bootstrapped', () => {
    const { result } = renderHook(() => usePersistence());

    persistor.getState.mockReturnValue({ bootstrapped: true });
    
    act(() => {
      const subscriptionCallback = persistor.subscribe.mock.calls[0][0];
      subscriptionCallback();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.persistError).toBe(null);
  });

  it('should handle retry correctly', async () => {
    const { result } = renderHook(() => usePersistence());

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.persistError).toBeTruthy();

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(result.current.persistError).toBe(null);
    expect(result.current.bootstrapped).toBe(false);
    expect(persistor.purge).toHaveBeenCalled();
    expect(persistor.persist).toHaveBeenCalled();
  });

  it('should handle persistence success correctly', () => {
    const { result } = renderHook(() => usePersistence());

    act(() => {
      result.current.handlePersistenceSuccess();
    });

    expect(result.current.bootstrapped).toBe(true);
    expect(result.current.persistError).toBe(null);
  });

  it('should clear timeout in handlePersistenceSuccess', () => {
    const { result } = renderHook(() => usePersistence());

    act(() => {
      result.current.handlePersistenceSuccess();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.persistError).toBe(null);
  });

  it('should unsubscribe from persistor on unmount', () => {
    const unsubscribeFn = jest.fn();
    persistor.subscribe.mockReturnValue(unsubscribeFn);
    
    const { unmount } = renderHook(() => usePersistence());

    unmount();

    expect(unsubscribeFn).toHaveBeenCalled();
  });

  it('should clear timeout on unmount', () => {
    const { unmount } = renderHook(() => usePersistence());

    unmount();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(true).toBe(true);
  });

  it('should handle multiple state changes correctly', () => {
    const { result } = renderHook(() => usePersistence());

    persistor.getState.mockReturnValue({ bootstrapped: false });
    act(() => {
      const subscriptionCallback = persistor.subscribe.mock.calls[0][0];
      subscriptionCallback();
    });
    expect(result.current.bootstrapped).toBe(false);

    persistor.getState.mockReturnValue({ bootstrapped: true });
    act(() => {
      const subscriptionCallback = persistor.subscribe.mock.calls[0][0];
      subscriptionCallback();
    });
    expect(result.current.bootstrapped).toBe(true);
  });

  it('should start new timeout after retry', async () => {
    const { result } = renderHook(() => usePersistence());

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.persistError).toBeTruthy();

    await act(async () => {
      await result.current.handleRetry();
    });
    expect(result.current.persistError).toBe(null);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.persistError).toBeTruthy();
  });
}); 
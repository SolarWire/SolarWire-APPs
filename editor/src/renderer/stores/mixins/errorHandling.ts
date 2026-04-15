import { StateCreator } from 'zustand';

export interface ErrorState {
  error: string | null;
  clearError: () => void;
}

export const withErrorHandling = <T extends object>(
  creator: StateCreator<T & ErrorState>
): StateCreator<T & ErrorState> => {
  return (set, get, store) => {
    return creator(
      (partial, replace) => {
        if (typeof partial === 'function') {
          set((state) => {
            const nextState = partial(state as any);
            return { ...nextState, error: nextState.error ?? state.error };
          }, replace);
        } else {
          set(partial as any, replace);
        }
      },
      get,
      store
    );
  };
};

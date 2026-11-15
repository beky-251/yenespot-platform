import { useSyncExternalStore } from "react";

// Return the server value during SSR and the client value in the browser.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    () => () => {},
    () => client,
    () => server
  );
}
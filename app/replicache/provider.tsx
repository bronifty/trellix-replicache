import { createContext, ReactNode, useContext, useMemo } from "react";
import { Replicache } from "replicache";
import { mutators } from "~/replicache/mutators";
import { useLoggedUserId } from "~/auth/provider";

const createReplicacheClient = (userId?: string | null) => {
  if (typeof window === "undefined" || !userId) {
    return null;
  }
  return new Replicache({
    name: userId,
    licenseKey: "le64e83045c504c128aaaec9512fa940c",
    pushURL: "/replicache/push",
    pullURL: "/replicache/pull",
    mutators,
  });
};

export const ReplicacheContext =
  createContext<Required<ReturnType<typeof createReplicacheClient>>>(null);

export const ReplicacheProvider = ({ children }: { children: ReactNode }) => {
  const userId = useLoggedUserId();
  const replicache = useMemo(() => createReplicacheClient(userId), [userId]);

  return (
    <ReplicacheContext.Provider value={replicache}>
      {children}
    </ReplicacheContext.Provider>
  );
};

export function useReplicache() {
  return useContext(ReplicacheContext);
}

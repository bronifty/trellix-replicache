import { Replicache } from "replicache";
import { mutators } from "~/replicache/mutators";

export const replicache =
  typeof window !== "undefined"
    ? new Replicache({
        name: "1234",
        licenseKey: "le64e83045c504c128aaaec9512fa940c",
        pushURL: "/replicache/push",
        pullURL: "/replicache/pull",
        mutators,
      })
    : null;

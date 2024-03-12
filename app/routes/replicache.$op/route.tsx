import { type LoaderFunctionArgs } from "@remix-run/node";
import { handleReplicachePull } from "./pull";
import { handleReplicachePush } from "./push";

// I'm using the Reset View backend strategy for Replicache: https://doc.replicache.dev/strategies/reset
// It is not the most scalable strategy, but it works well for the purposes of this demo.
export async function action({ request, params }: LoaderFunctionArgs) {
  if (params.op === "pull") {
    return handleReplicachePull(request);
  } else if (params.op === "push") {
    return handleReplicachePush(request);
  }
}

import { type LoaderFunctionArgs } from "@remix-run/node";
import { handleReplicachePull } from "./pull";
import { handleReplicachePush } from "./push";

export async function action({ request, params }: LoaderFunctionArgs) {
  if (params.op === "pull") {
    return handleReplicachePull(request);
  } else if (params.op === "push") {
    return handleReplicachePush(request);
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (params.op === "pull") {
    return handleReplicachePull(request);
  } else if (params.op === "push") {
    return handleReplicachePush(request);
  }
}

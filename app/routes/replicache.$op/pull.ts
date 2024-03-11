import { json } from "@remix-run/node";

export async function handleReplicachePull(request: Request): Promise<Response> {
  return json({
    lastMutationID: 0,
    cookie: 42,
    patch: []
  });
}
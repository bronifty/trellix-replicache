import { json } from "@remix-run/node";
import { requireAuthCookie } from "~/auth/auth";
import { PatchOperation, PullRequestV1, PullResponseV1 } from "replicache";
import { prisma } from "~/db/prisma";
import { BoardData, ColumnData, ItemData } from "~/replicache/data";

export async function handleReplicachePull(
  request: Request,
): Promise<Response> {
  const accountId = await requireAuthCookie(request);
  const pull = (await request.json()) as PullRequestV1;

  const payload = await prisma.$transaction(async (tx) => {
    let replicacheClientGroup = await tx.replicacheClientGroup.findFirst({
      where: {
        id: pull.clientGroupID,
        accountId,
      },
    });
    replicacheClientGroup ??= { id: pull.clientGroupID, accountId };

    const patch: PatchOperation[] = [{ op: "clear" }];

    const boards = await tx.board.findMany({
      where: {
        accountId,
      },
      include: {
        columns: {
          include: {
            items: true,
          },
        },
      },
    });

    for (const board of boards) {
      patch.push({
        op: "put",
        key: `board/${board.id}`,
        value: {
          id: board.id,
          name: board.name,
          color: board.color,
          createdAt: board.createdAt.toISOString(),
        } satisfies BoardData,
      });

      for (const column of board.columns) {
        patch.push({
          op: "put",
          key: `column/${column.id}`,
          value: {
            id: column.id,
            boardId: column.boardId,
            name: column.name,
            order: column.order,
          } satisfies ColumnData,
        });

        for (const item of column.items) {
          patch.push({
            op: "put",
            key: `item/${item.id}`,
            value: {
              id: item.id,
              columnId: item.columnId,
              boardId: item.boardId,
              order: item.order,
              title: item.title,
            } satisfies ItemData,
          });
        }
      }
    }

    const replicacheClients = await tx.replicacheClient.findMany({
      where: {
        clientGroupId: replicacheClientGroup.id,
      },
    });

    const lastMutationIDChanges = Object.fromEntries(
      replicacheClients.map((c) => [c.id, c.lastMutationID]),
    );

    return {
      lastMutationIDChanges,
      cookie: Date.now(),
      patch,
    } satisfies PullResponseV1;
  });

  return json(payload);
}

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

  let replicacheClientGroup = await prisma.replicacheClientGroup.findFirst({
    where: {
      id: pull.clientGroupID,
      accountId,
    },
  });
  replicacheClientGroup ??= { id: pull.clientGroupID, accountId };

  const patch: PatchOperation[] = [{ op: "clear" }];

  const boards = await prisma.board.findMany({
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
      } as BoardData,
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
        } as ColumnData,
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
          } as ItemData,
        });
      }
    }
  }

  const replicacheClients = await prisma.replicacheClient.findMany({
    where: {
      clientGroupId: replicacheClientGroup.id,
    },
  });

  const lastMutationIDChanges = Object.fromEntries(
    replicacheClients.map((c) => [c.id, c.lastMutationID]),
  );

  const payload: PullResponseV1 = {
    lastMutationIDChanges,
    cookie: Date.now(),
    patch,
  };

  return json(payload);
}

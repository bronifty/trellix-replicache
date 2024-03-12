import { json } from "@remix-run/node";
import { requireAuthCookie } from "~/auth/auth";
import { PushRequestV1 } from "replicache";
import { prisma } from "~/db/prisma";
import { BoardData, ColumnData, ItemData } from "~/replicache/data";
import invariant from "tiny-invariant";

export async function handleReplicachePush(
  request: Request,
): Promise<Response> {
  const accountId = await requireAuthCookie(request);
  const push = (await request.json()) as PushRequestV1;

  let replicacheClientGroup = await prisma.replicacheClientGroup.findFirst({
    where: {
      id: push.clientGroupID,
      accountId,
    },
  });
  replicacheClientGroup ??= { id: push.clientGroupID, accountId };

  for (const mutation of push.mutations) {
    await prisma.$transaction(async (tx) => {
      let replicacheClient = await tx.replicacheClient.findFirst({
        where: {
          id: mutation.clientID,
        },
      });
      replicacheClient ??= {
        id: mutation.clientID,
        clientGroupId: push.clientGroupID,
        lastMutationID: 0,
      };

      const nextMutationID = replicacheClient.lastMutationID + 1;

      if (mutation.id < nextMutationID) {
        console.log(
          `Mutation ${mutation.id} has already been processed - skipping`,
        );
        return;
      }

      if (mutation.id > nextMutationID) {
        throw new Error(
          `Mutation ${mutation.id} is from the future - aborting. This can happen in development if the server restarts. In that case, clear appliation data in browser and refresh.`,
        );
      }

      switch (mutation.name) {
        case "createBoard": {
          const data = mutation.args as BoardData;
          await tx.board.create({
            data: {
              id: data.id,
              name: data.name,
              color: data.color,
              createdAt: new Date(data.createdAt),
              accountId,
            },
          });
          break;
        }
        case "updateBoard": {
          const { id, ...data } = mutation.args as BoardData;
          await tx.board.update({
            where: { id, accountId },
            data: data,
          });
          break;
        }
        case "deleteBoard": {
          await tx.board.delete({
            where: { id: mutation.args as string, accountId },
          });
          break;
        }
        case "createColumn": {
          const { id, boardId, ...data } = mutation.args as ColumnData;

          const board = await tx.board.findFirstOrThrow({
            where: { id: boardId, accountId },
          });
          invariant(board.accountId === accountId, "User does not own board");

          await tx.column.create({
            data: {
              id,
              boardId,
              name: data.name,
              order: data.order,
            },
          });
          break;
        }
        case "updateColumn": {
          const { id, ...data } = mutation.args as ColumnData;

          const column = await tx.column.findFirstOrThrow({
            where: { id },
            include: {
              Board: true,
            },
          });
          invariant(
            column.Board.accountId === accountId,
            "User does not own board",
          );

          await tx.column.update({
            where: { id },
            data: data,
          });
          break;
        }
        case "deleteColumn": {
          const id = mutation.args as string;
          const column = await tx.column.findFirstOrThrow({
            where: { id: id },
            include: {
              Board: true,
            },
          });
          invariant(
            column.Board.accountId === accountId,
            "User does not own board",
          );

          await tx.column.delete({
            where: { id },
          });
          break;
        }
        case "createItem": {
          const { id, columnId, ...data } = mutation.args as ItemData;
          const column = await tx.column.findFirstOrThrow({
            where: { id: columnId },
            include: {
              Board: true,
            },
          });
          invariant(
            column.Board.accountId === accountId,
            "User does not own board",
          );

          await tx.item.create({
            data: {
              id,
              columnId,
              title: data.title,
              content: data.content,
              order: data.order,
              boardId: data.boardId,
            },
          });
          break;
        }
        case "updateItem": {
          const { id, ...data } = mutation.args as ItemData;
          const item = await tx.item.findFirstOrThrow({
            where: { id },
            include: {
              Column: {
                include: {
                  Board: true,
                },
              },
            },
          });
          invariant(
            item.Column.Board.accountId === accountId,
            "User does not own board",
          );

          await tx.item.update({
            where: { id },
            data: data,
          });
          break;
        }
        case "deleteItem": {
          const id = mutation.args as string;
          const item = await tx.item.findFirstOrThrow({
            where: { id },
            include: {
              Column: {
                include: {
                  Board: true,
                },
              },
            },
          });
          invariant(
            item.Column.Board.accountId === accountId,
            "User does not own board",
          );

          await tx.item.delete({
            where: { id },
          });
          break;
        }
      }

      await tx.replicacheClientGroup.upsert({
        where: { id: push.clientGroupID, accountId },
        update: replicacheClientGroup,
        create: replicacheClientGroup,
      });

      await tx.replicacheClient.upsert({
        where: { id: mutation.clientID },
        update: {
          id: mutation.clientID,
          clientGroupId: push.clientGroupID,
          lastMutationID: nextMutationID,
        },
        create: {
          id: mutation.clientID,
          clientGroupId: push.clientGroupID,
          lastMutationID: nextMutationID,
        },
      });
    });
  }

  return json({});
}

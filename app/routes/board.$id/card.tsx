import invariant from "tiny-invariant";
import { useState } from "react";

import { Icon } from "~/icons/icons";

import { CONTENT_TYPES } from "./types";
import { replicache } from "~/replicache/client";
import { ItemData } from "~/replicache/data";
import { undoManager } from "~/replicache/undo";

interface CardProps {
  title: string;
  content?: string | null;
  id: string;
  columnId: string;
  order: number;
  nextOrder: number;
  previousOrder: number;
}

export function Card({
  title,
  content,
  id,
  columnId,
  order,
  nextOrder,
  previousOrder,
}: CardProps) {
  let [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">("none");

  return (
    <li
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
          event.preventDefault();
          event.stopPropagation();
          let rect = event.currentTarget.getBoundingClientRect();
          let midpoint = (rect.top + rect.bottom) / 2;
          setAcceptDrop(event.clientY <= midpoint ? "top" : "bottom");
        }
      }}
      onDragLeave={() => {
        setAcceptDrop("none");
      }}
      onDrop={async (event) => {
        event.stopPropagation();

        let transfer = JSON.parse(
          event.dataTransfer.getData(CONTENT_TYPES.card),
        );
        invariant(transfer.id, "missing cardId");
        invariant(transfer.title, "missing title");

        let droppedOrder = acceptDrop === "top" ? previousOrder : nextOrder;
        let moveOrder = (droppedOrder + order) / 2;

        const item = await replicache?.query(async (tx) => {
          const [result] = await tx
            .scan<ItemData>({
              prefix: `item/${transfer.id}`,
              limit: 1,
            })
            .values()
            .toArray();
          return result;
        });

        invariant(item, "missing item");

        undoManager.add({
          execute: () =>
            replicache?.mutate.updateItem({
              id: transfer.id,
              order: moveOrder,
              columnId: columnId,
            }),
          undo: () => {
            console.log("undoing");
            replicache?.mutate.updateItem(item);
          },
        });

        setAcceptDrop("none");
      }}
      className={
        "border-t-2 border-b-2 -mb-[2px] last:mb-0 cursor-grab active:cursor-grabbing px-2 py-1 " +
        (acceptDrop === "top"
          ? "border-t-brand-red border-b-transparent"
          : acceptDrop === "bottom"
            ? "border-b-brand-red border-t-transparent"
            : "border-t-transparent border-b-transparent")
      }
    >
      <div
        draggable
        className="bg-white shadow shadow-slate-300 border-slate-300 text-sm rounded-lg w-full py-1 px-2 relative"
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            CONTENT_TYPES.card,
            JSON.stringify({ id, title }),
          );
        }}
      >
        <h3>{title}</h3>
        <div className="mt-2">{content || <>&nbsp;</>}</div>
        <form
          onSubmit={async (event) => {
            event.preventDefault();

            const item = await replicache?.query(async (tx) => {
              const [result] = await tx
                .scan<ItemData>({
                  prefix: `item/${id}`,
                  limit: 1,
                })
                .values()
                .toArray();
              return result;
            });

            invariant(item, "missing item");

            undoManager.add({
              execute: () => replicache?.mutate.deleteItem(id),
              undo: () => replicache?.mutate.updateItem(item),
            });
          }}
        >
          <button
            aria-label="Delete card"
            className="absolute top-4 right-4 hover:text-brand-red"
            type="submit"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Icon name="trash" />
          </button>
        </form>
      </div>
    </li>
  );
}

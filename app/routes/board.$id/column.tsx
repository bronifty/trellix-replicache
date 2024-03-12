import { useRef, useState } from "react";
import invariant from "tiny-invariant";

import { Icon } from "~/icons/icons";

import { CONTENT_TYPES } from "./types";
import { NewCard } from "./new-card";
import { flushSync } from "react-dom";
import { Card } from "./card";
import { EditableText } from "./components";
import { useSubscribe } from "replicache-react";
import { replicache } from "~/replicache/client";
import { ItemData } from "~/replicache/data";

interface ColumnProps {
  name: string;
  columnId: string;
  boardId: string;
}

export function Column({ name, columnId, boardId }: ColumnProps) {
  const items = useSubscribe(
    replicache,
    async (tx) => {
      const items = await tx
        .scan<ItemData>({ prefix: `item/` })
        .values()
        .toArray();

      return items
        .filter((c) => c.columnId === columnId)
        .sort((a, b) => a.order - b.order);
    },
    {
      dependencies: [columnId],
      default: [],
    },
  );

  let [acceptDrop, setAcceptDrop] = useState(false);
  let [edit, setEdit] = useState(false);
  let listRef = useRef<HTMLUListElement>(null);

  function scrollList() {
    invariant(listRef.current);
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }

  return (
    <div
      className={
        "flex-shrink-0 flex flex-col overflow-hidden max-h-full w-80 border-slate-400 rounded-xl shadow-sm shadow-slate-400 bg-slate-100 " +
        (acceptDrop ? `outline outline-2 outline-brand-red` : ``)
      }
      onDragOver={(event) => {
        if (
          items.length === 0 &&
          event.dataTransfer.types.includes(CONTENT_TYPES.card)
        ) {
          event.preventDefault();
          setAcceptDrop(true);
        }
      }}
      onDragLeave={() => {
        setAcceptDrop(false);
      }}
      onDrop={(event) => {
        let transfer = JSON.parse(
          event.dataTransfer.getData(CONTENT_TYPES.card),
        );
        invariant(transfer.id, "missing transfer.id");
        invariant(transfer.title, "missing transfer.title");

        replicache?.mutate.updateItem({
          id: transfer.id,
          columnId: columnId,
          order: 1,
        });

        setAcceptDrop(false);
      }}
    >
      <div className="p-2">
        <EditableText
          fieldName="name"
          value={name}
          inputLabel="Edit column name"
          buttonLabel={`Edit column "${name}" name`}
          inputClassName="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
          buttonClassName="block rounded-lg text-left w-full border border-transparent py-1 px-2 font-medium text-slate-600"
          onEdit={(text) => {
            replicache?.mutate.updateColumn({ id: columnId, name: text });
          }}
        />
      </div>

      <ul ref={listRef} className="flex-grow overflow-auto">
        {items
          .sort((a, b) => a.order - b.order)
          .map((item, index, items) => (
            <Card
              key={item.id}
              title={item.title}
              content={item.content}
              id={item.id}
              order={item.order}
              columnId={columnId}
              previousOrder={items[index - 1] ? items[index - 1].order : 0}
              nextOrder={
                items[index + 1] ? items[index + 1].order : item.order + 1
              }
            />
          ))}
      </ul>
      {edit ? (
        <NewCard
          boardId={boardId}
          columnId={columnId}
          nextOrder={items.length === 0 ? 1 : items[items.length - 1].order + 1}
          onAddCard={() => scrollList()}
          onComplete={() => setEdit(false)}
        />
      ) : (
        <div className="p-2">
          <button
            type="button"
            onClick={() => {
              flushSync(() => {
                setEdit(true);
              });
              scrollList();
            }}
            className="flex items-center gap-2 rounded-lg text-left w-full p-2 font-medium text-slate-500 hover:bg-slate-200 focus:bg-slate-200"
          >
            <Icon name="plus" /> Add a card
          </button>
        </div>
      )}
    </div>
  );
}

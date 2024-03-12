import { useRef } from "react";
import invariant from "tiny-invariant";
import { useParams } from "@remix-run/react";
import { Column } from "./column";
import { NewColumn } from "./new-column";
import { EditableText } from "./components";
import { useSubscribe } from "replicache-react";
import { replicache } from "~/replicache/client";
import { BoardData, ColumnData } from "~/replicache/data";

export function Board() {
  const { id } = useParams();

  const board = useSubscribe(replicache, async (tx) => {
    const [board] = await tx
      .scan<BoardData>({ prefix: `board/${id}`, limit: 1 })
      .values()
      .toArray();
    return board;
  });

  const columns = useSubscribe(
    replicache,
    async (tx) => {
      const columns = await tx
        .scan<ColumnData>({ prefix: `column/` })
        .values()
        .toArray();

      return columns
        .filter((c) => c.boardId === id)
        .sort((a, b) => a.order - b.order);
    },
    {
      dependencies: [id],
      default: [],
    },
  );

  let scrollContainerRef = useRef<HTMLDivElement>(null);

  function scrollRight() {
    invariant(scrollContainerRef.current, "no scroll container");
    scrollContainerRef.current.scrollLeft =
      scrollContainerRef.current.scrollWidth;
  }

  if (!board) {
    return null;
  }

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: board.color }}
    >
      <h1>
        <EditableText
          value={board.name}
          fieldName="name"
          inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
          buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
          buttonLabel={`Edit board "${board.name}" name`}
          inputLabel="Edit board name"
          onEdit={(text) => {
            replicache?.mutate.updateBoard({ id: board.id, name: text });
          }}
        />
      </h1>

      <div className="flex flex-grow min-h-0 h-full items-start gap-4 px-8 pb-4">
        {[...columns.values()].map((col) => {
          return <Column key={col.id} name={col.name} columnId={col.id} />;
        })}

        <NewColumn
          boardId={board.id}
          onAdd={scrollRight}
          editInitially={columns.length === 0}
          nextOrder={columns.length + 1}
        />

        {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
        <div data-lol className="w-8 h-1 flex-shrink-0" />
      </div>
    </div>
  );
}

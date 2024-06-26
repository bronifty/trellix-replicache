import { useEffect, useRef } from "react";
import invariant from "tiny-invariant";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { Column } from "./column";
import { NewColumn } from "./new-column";
import { EditableText } from "./components";
import { useSubscribe } from "replicache-react";
import { BoardData, ColumnData } from "~/replicache/data";
import { Icon } from "~/icons/icons";
import { useHotkeys } from "react-hotkeys-hook";
import { undoManager } from "~/replicache/undo";
import { useReplicache } from "~/replicache/provider";
import { useEnsureLoggedIn } from "~/auth/provider";

export function Board() {
  const { id } = useParams();

  const replicache = useReplicache();

  const boards = useSubscribe(replicache, async (tx) => {
    return tx
      .scan<BoardData>({ prefix: `board/${id}`, limit: 1 })
      .values()
      .toArray();
  });

  const board = boards?.[0];
  const doesBoardExist = !!board || !boards;

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

  const navigate = useNavigate();

  useHotkeys("esc", () => navigate("/home"), []);

  let scrollContainerRef = useRef<HTMLDivElement>(null);

  useEnsureLoggedIn();

  useEffect(() => {
    if (!doesBoardExist) {
      navigate("/home");
    }
  }, [doesBoardExist]);

  if (!board) {
    return null;
  }

  function scrollRight() {
    invariant(scrollContainerRef.current, "no scroll container");
    scrollContainerRef.current.scrollLeft =
      scrollContainerRef.current.scrollWidth;
  }

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: board.color }}
    >
      <div className="mx-8 my-4 flex items-center gap-3">
        <Link to="/home">
          <span className="sr-only">Go to home</span>
          <Icon name="arrow-left" size="lg" />
        </Link>
        <h1>
          <EditableText
            value={board.name}
            fieldName="name"
            inputClassName="text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
            buttonClassName="text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
            buttonLabel={`Edit board "${board.name}" name`}
            inputLabel="Edit board name"
            onEdit={(text) => {
              undoManager.add({
                execute: () => {
                  replicache?.mutate.updateBoard({ id: board.id, name: text });
                },
                undo: () => {
                  replicache?.mutate.updateBoard({
                    id: board.id,
                    name: board.name,
                  });
                },
              });
            }}
          />
        </h1>
      </div>

      <div className="flex flex-grow min-h-0 h-full items-start gap-4 px-8 pb-4">
        {[...columns.values()].map((col) => (
          <Column
            key={col.id}
            name={col.name}
            columnId={col.id}
            boardId={board.id}
          />
        ))}

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

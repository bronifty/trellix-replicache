import { Link, useNavigate } from "@remix-run/react";
import { Button } from "~/components/button";
import { Label, LabeledInput } from "~/components/input";
import { Icon } from "~/icons/icons";
import { useSubscribe } from "replicache-react";
import { replicache } from "~/replicache/client";
import { BoardData, ItemData } from "~/replicache/data";
import { nanoid } from "nanoid";
import { undoManager } from "~/replicache/undo";
import invariant from "tiny-invariant";

export const meta = () => {
  return [{ title: "Boards" }];
};

export default function Projects() {
  return (
    <div className="h-full">
      <NewBoard />
      <Boards />
    </div>
  );
}

function Boards() {
  const boards = useSubscribe(
    replicache,
    (tx) => tx.scan<BoardData>({ prefix: `board/` }).values().toArray(),
    {
      default: [],
    },
  );

  return (
    <div className="p-8">
      <h2 className="font-bold mb-2 text-xl">Boards</h2>
      <nav className="flex flex-wrap gap-8">
        {boards.map((board) => (
          <Board
            key={board.id}
            name={board.name}
            id={board.id}
            color={board.color}
          />
        ))}
      </nav>
    </div>
  );
}

function Board({
  name,
  id,
  color,
}: {
  name: string;
  id: string;
  color: string;
}) {
  return (
    <Link
      to={`/board/${id}`}
      className="w-60 h-40 p-4 block border-b-8 shadow rounded hover:shadow-lg bg-white relative"
      style={{ borderColor: color }}
    >
      <div className="font-bold">{name}</div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const board = await replicache?.query(async (tx) => {
            const [result] = await tx
              .scan<BoardData>({
                prefix: `board/${id}`,
                limit: 1,
              })
              .values()
              .toArray();
            return result;
          });

          invariant(board, "missing board");

          undoManager.add({
            execute: () => replicache?.mutate.deleteBoard(id),
            undo: () => replicache?.mutate.createBoard(board),
          });
        }}
      >
        <button
          aria-label="Delete board"
          className="absolute top-4 right-4 hover:text-brand-red"
          type="submit"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <Icon name="trash" />
        </button>
      </form>
    </Link>
  );
}

function NewBoard() {
  let navigate = useNavigate();

  return (
    <form
      className="p-8 max-w-md"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const board: BoardData = {
          id: nanoid(),
          name: formData.get("name") as string,
          color: formData.get("color") as string,
          createdAt: new Date().toISOString(),
        };

        undoManager.add({
          execute: () => {
            replicache?.mutate.createBoard(board);
            navigate(`/board/${board.id}`);
          },
          undo: () => {
            replicache?.mutate.deleteBoard(board.id);
            navigate("/home");
          },
        });
      }}
    >
      <div>
        <h2 className="font-bold mb-2 text-xl">New Board</h2>
        <LabeledInput label="Name" name="name" type="text" required autoFocus />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Label htmlFor="board-color">Color</Label>
          <input
            id="board-color"
            name="color"
            type="color"
            defaultValue="#cbd5e1"
            className="bg-transparent"
          />
        </div>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
}

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import invariant from "tiny-invariant";
import { Icon } from "~/icons/icons";
import { Form } from "@remix-run/react";

import { CancelButton, SaveButton } from "./components";
import { nanoid } from "nanoid";
import { ColumnData } from "~/replicache/data";
import { undoManager } from "~/replicache/undo";
import { useReplicache } from "~/replicache/provider";

export function NewColumn({
  boardId,
  nextOrder,
  onAdd,
  editInitially,
}: {
  boardId: string;
  nextOrder: number;
  onAdd: () => void;
  editInitially: boolean;
}) {
  let [editing, setEditing] = useState(editInitially);
  let inputRef = useRef<HTMLInputElement>(null);
  let replicache = useReplicache();

  return editing ? (
    <Form
      method="post"
      navigate={false}
      className="p-2 flex-shrink-0 flex flex-col gap-5 overflow-hidden max-h-full w-80 border rounded-xl shadow bg-slate-100"
      onSubmit={(event) => {
        event.preventDefault();

        let formData = new FormData(event.currentTarget);

        const column: ColumnData = {
          id: nanoid(),
          boardId,
          name: formData.get("name") as string,
          order: nextOrder,
        };

        undoManager.add({
          execute: () => replicache?.mutate.createColumn(column),
          undo: () => replicache?.mutate.deleteColumn(column.id),
        });

        onAdd();

        invariant(inputRef.current, "missing input ref");
        inputRef.current.value = "";
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setEditing(false);
        }
      }}
    >
      <input
        autoFocus
        required
        ref={inputRef}
        type="text"
        name="name"
        className="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
      />
      <div className="flex justify-between">
        <SaveButton>Save Column</SaveButton>
        <CancelButton onClick={() => setEditing(false)}>Cancel</CancelButton>
      </div>
    </Form>
  ) : (
    <button
      onClick={() => {
        flushSync(() => {
          setEditing(true);
        });
        onAdd();
      }}
      aria-label="Add new column"
      className="flex-shrink-0 flex justify-center h-16 w-16 bg-black hover:bg-white bg-opacity-10 hover:bg-opacity-5 rounded-xl"
    >
      <Icon name="plus" size="xl" />
    </button>
  );
}

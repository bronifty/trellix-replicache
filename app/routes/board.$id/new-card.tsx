import { useRef } from "react";
import invariant from "tiny-invariant";
import { CancelButton, SaveButton } from "./components";
import { nanoid } from "nanoid";
import { undoManager } from "~/replicache/undo";
import { useReplicache } from "~/replicache/provider";

export function NewCard({
  columnId,
  boardId,
  nextOrder,
  onComplete,
  onAddCard,
}: {
  columnId: string;
  boardId: string;
  nextOrder: number;
  onComplete: () => void;
  onAddCard: () => void;
}) {
  let textAreaRef = useRef<HTMLTextAreaElement>(null);
  let buttonRef = useRef<HTMLButtonElement>(null);
  let replicache = useReplicache();

  return (
    <form
      className="px-2 py-1 border-t-2 border-b-2 border-transparent"
      onSubmit={(event) => {
        event.preventDefault();

        let formData = new FormData(event.currentTarget);

        const item = {
          id: nanoid(),
          columnId,
          boardId,
          order: nextOrder,
          title: formData.get("title") as string,
        };

        undoManager.add({
          execute: () => replicache?.mutate.createItem(item),
          undo: () => replicache?.mutate.deleteItem(item.id),
        });

        invariant(textAreaRef.current);
        textAreaRef.current.value = "";
        onAddCard();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onComplete();
        }
      }}
    >
      <textarea
        autoFocus
        required
        ref={textAreaRef}
        name="title"
        placeholder="Enter a title for this card"
        className="outline-none shadow text-sm rounded-lg w-full py-1 px-2 resize-none placeholder:text-sm placeholder:text-slate-500 h-14"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            invariant(buttonRef.current, "expected button ref");
            buttonRef.current.click();
          }
          if (event.key === "Escape") {
            onComplete();
          }
        }}
        onChange={(event) => {
          let el = event.currentTarget;
          el.style.height = el.scrollHeight + "px";
        }}
      />
      <div className="flex justify-between">
        <SaveButton ref={buttonRef}>Save Card</SaveButton>
        <CancelButton onClick={onComplete}>Cancel</CancelButton>
      </div>
    </form>
  );
}

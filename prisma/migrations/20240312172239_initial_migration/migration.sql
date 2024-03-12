-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_boardId_fkey";

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

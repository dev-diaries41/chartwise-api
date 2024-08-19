import { TradeJournal } from "../mongo/models/journal";
import { addDoc } from "../mongo/utils/add";
import { getDocs } from "../mongo/utils/get";
import { AddDocResponse, GetDocsResponse, ITradeJournalEntry } from "../types";

export async function addJournalEntry(entry: ITradeJournalEntry): Promise<AddDocResponse>{
    const result = await addDoc(TradeJournal, entry);
    return result;
}

export async function getJournalEntries(userId: string, page: number| string, perPage: number| string): Promise<GetDocsResponse<ITradeJournalEntry>> {
  const result = await getDocs<ITradeJournalEntry>(TradeJournal, { userId}, page, perPage);
  if (!result.success || !result.data) throw new Error(result.message);
  return result;
}
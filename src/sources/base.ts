/**
 * Purpose:
 * This file defines the contract every source adapter should follow.
 * If you later pull from RSS, APIs, web scraping, or a database, each adapter
 * can still plug into the same pipeline as long as it returns raw source items.
 */

import type { RawSourceItem } from "../types";

export interface SourceAdapter {
  name: string;
  fetchItems(): Promise<RawSourceItem[]>;
}

/**
 * Purpose:
 * This file now acts as the small loader layer for ranking preferences.
 * The actual tunable data lives in preferences.json so you can change weights
 * and keywords without editing TypeScript logic.
 */

import type { UserPreferences } from "../types";
import preferencesData from "./preferences.json";

export const defaultPreferences: UserPreferences = preferencesData as UserPreferences;

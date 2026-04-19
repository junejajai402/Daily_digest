/**
 * Purpose:
 * This file is the central registry for all source adapters.
 * Keeping adapter registration in one place makes it easy to add or remove
 * sources without rewriting the rest of the pipeline.
 */

import type { SourceAdapter } from "./base";
import { schneierSecuritySource } from "./schneier-security";
import { bbcWorldSource } from "./bbc-world";
import { bbcTechSource } from "./bbc-tech";
import { guardianWorldSource } from "./guardian-world";
import { guardianTechSource } from "./guardian-tech";
import { hackerNewsSource } from "./hacker-news";
import { sansIscSource } from "./sans-isc";
import { pitchforkBestNewAlbumsSource } from "./pitchfork-best-new-albums";
import { pitchforkAlbumReviewsSource } from "./pitchfork-album-reviews";
import { nprMusicNewsSource } from "./npr-music-news";
import { nmeMusicNewsSource } from "./nme-music-news";

export const sourceAdapters: SourceAdapter[] = [
  schneierSecuritySource,
  bbcWorldSource,
  bbcTechSource,
  guardianWorldSource,
  guardianTechSource,
  hackerNewsSource,
  sansIscSource,
  pitchforkBestNewAlbumsSource,
  pitchforkAlbumReviewsSource,
  nprMusicNewsSource,
  nmeMusicNewsSource,
];

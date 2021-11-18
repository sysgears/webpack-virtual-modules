// I cannot write clean TypeScript :(

import type { Watchpack } from 'watchpack';

declare interface FileSystemInfoEntry {
  safeTime: number;
  timestamp?: number;
}

export declare interface Watcher {
  close: () => void;
  pause: () => void;
  getAggregatedChanges?: () => Set<string>;
  getAggregatedRemovals?: () => Set<string>;
  getFileTimeInfoEntries: () => Map<string, FileSystemInfoEntry | 'ignore'>;
  getContextTimeInfoEntries: () => Map<string, FileSystemInfoEntry | 'ignore'>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
declare interface WatchOptions {}

declare interface WatchFileSystem {
  watch: (
    files: Iterable<string>,
    directories: Iterable<string>,
    missing: Iterable<string>,
    startTime: number,
    options: WatchOptions,
    callback: (
      arg0: undefined | Error,
      arg1: Map<string, FileSystemInfoEntry | 'ignore'>,
      arg2: Map<string, FileSystemInfoEntry | 'ignore'>,
      arg3: Set<string>,
      arg4: Set<string>
    ) => void,
    callbackUndelayed: (arg0: string, arg1: number) => void
  ) => Watcher;
}

export declare interface NodeWatchFileSystem extends WatchFileSystem {
  inputFileSystem: any;
  watcherOptions: object;
  watcher: Watchpack;
}

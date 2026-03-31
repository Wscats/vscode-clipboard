/**
 * Clipboard Manager - Clipboard history management.
 * Stores, persists, and manages clipboard history items.
 *
 * @author Eno Yao
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { IClipboardTextChange, Monitor } from "./monitor";
import { getErrorMessage } from "./util";

export interface IClipboardItem {
  value: string;
  createdAt: number;
  lastUse?: number;
  copyCount: number;
  useCount: number;
  language?: string;
  createdLocation?: vscode.Location;
}

/** Shape of the persisted clipboard history JSON file. */
interface ClipboardStore {
  version: number;
  clips: ClipboardStoreItem[];
}

/** Shape of a single clip in the persisted JSON. */
interface ClipboardStoreItem {
  value: string;
  createdAt: number;
  timestamp?: number; // v1 compat
  copyCount: number;
  useCount: number;
  language?: string;
  createdLocation?: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  };
  location?: unknown; // v1 compat
}

/** Shape used in jsonReplacer for serializing vscode.Location. */
interface SerializedLocation {
  range: {
    start: vscode.Position;
    end: vscode.Position;
  };
  uri: string;
}

export class ClipboardManager implements vscode.Disposable {
  protected _disposable: vscode.Disposable[] = [];

  protected _clips: IClipboardItem[] = [];

  get clips(): IClipboardItem[] {
    return this._clips;
  }

  protected lastUpdate: number = 0;

  private _onDidClipListChange = new vscode.EventEmitter<void>();
  public readonly onDidChangeClipList = this._onDidClipListChange.event;

  constructor(
    protected context: vscode.ExtensionContext,
    protected _monitor: Monitor
  ) {
    this._monitor.onDidChangeText(this.updateClipList, this, this._disposable);

    this.loadClips();

    vscode.window.onDidChangeWindowState(
      state => {
        if (state.focused) {
          this.checkClipsUpdate();
        }
      },
      this,
      this._disposable
    );

    vscode.workspace.onDidChangeConfiguration(
      e => e.affectsConfiguration("clipboard-manager") && this.saveClips()
    );
  }

  /** Add a new clipboard change to the history list. */
  protected updateClipList(change: IClipboardTextChange): void {
    this.checkClipsUpdate();

    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const maxClips = config.get("maxClips", 100);
    const avoidDuplicates = config.get("avoidDuplicates", true);

    let item: IClipboardItem = {
      value: change.value,
      createdAt: change.timestamp,
      copyCount: 1,
      useCount: 0,
      language: change.language,
      createdLocation: change.location,
    };

    if (avoidDuplicates) {
      const index = this._clips.findIndex(c => c.value === change.value);

      // Remove same clips and move recent to top
      if (index >= 0) {
        const existing = this._clips[index];
        if (existing) {
          existing.copyCount++;
          item = existing;
        }
        this._clips = this._clips.filter(c => c.value !== change.value);
      }
    }

    // Add to top
    this._clips.unshift(item);

    // Max clips to store
    if (maxClips > 0) {
      this._clips = this._clips.slice(0, maxClips);
    }

    this._onDidClipListChange.fire();
    this.saveClips();
  }

  /** Set a clipboard value and optionally move it to the top. */
  public async setClipboardValue(value: string): Promise<void> {
    this.checkClipsUpdate();

    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const moveToTop = config.get("moveToTop", true);

    const index = this._clips.findIndex(c => c.value === value);

    if (index >= 0) {
      const clip = this._clips[index];
      if (clip) {
        clip.useCount++;
      }

      if (moveToTop) {
        const clips = this.clips.splice(index, 1);
        this._clips.unshift(...clips);
        this._onDidClipListChange.fire();
        this.saveClips();
      }
    }

    await this._monitor.clipboard.writeText(value);
  }

  /** Remove a specific value from clipboard history. */
  public removeClipboardValue(value: string): boolean {
    this.checkClipsUpdate();

    const prevLength = this._clips.length;

    this._clips = this._clips.filter(c => c.value !== value);
    this._onDidClipListChange.fire();
    this.saveClips();

    return prevLength !== this._clips.length;
  }

  /** Clear all clipboard history. */
  public clearAll(): boolean {
    this.checkClipsUpdate();

    this._clips = [];
    this._onDidClipListChange.fire();
    this.saveClips();

    return true;
  }

  /**
   * Get the file path for persisting clipboard history.
   * Returns `false` if persistence is disabled.
   */
  protected getStoreFile(): string | false {
    let folder = os.tmpdir();

    if (this.context.storagePath) {
      const parts = this.context.storagePath.split(
        /[\\/]workspaceStorage[\\/]/
      );
      if (parts[0]) {
        folder = parts[0];
      }
    }

    const filePath = path.join(folder, "clipboard.history.json");

    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const saveTo = config.get<string | null | boolean>("saveTo");

    if (typeof saveTo === "string") {
      return saveTo;
    }

    if (saveTo === false) {
      return false;
    }

    return filePath;
  }

  /** JSON replacer that serializes vscode.Location and vscode.Uri. */
  protected jsonReplacer(key: string, value: unknown): unknown {
    if (key === "createdLocation" && value) {
      const loc = value as vscode.Location;
      const serialized: SerializedLocation = {
        range: {
          start: loc.range.start,
          end: loc.range.end,
        },
        uri: loc.uri.toString(),
      };
      return serialized;
    } else if (value instanceof vscode.Uri) {
      return value.toString();
    }

    return value;
  }

  /** Persist the current clipboard history to disk. */
  public saveClips(): void {
    const file = this.getStoreFile();
    if (!file) {
      return;
    }

    let json = "[]";
    try {
      json = JSON.stringify(
        {
          version: 2,
          clips: this._clips,
        },
        this.jsonReplacer,
        2
      );
    } catch (error: unknown) {
      console.error(error);
      return;
    }

    try {
      fs.writeFileSync(file, json);
      this.lastUpdate = fs.statSync(file).mtimeMs;
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      switch (fsError.code) {
        case "EPERM":
          vscode.window.showErrorMessage(
            `Not permitted to save clipboards on "${file}"`
          );
          break;
        case "EISDIR":
          vscode.window.showErrorMessage(
            `Failed to save clipboards on "${file}", because the path is a directory`
          );
          break;
        default:
          console.error(error);
      }
    }
  }

  /** Check if the clip history was changed from another workspace. */
  public checkClipsUpdate(): void {
    const file = this.getStoreFile();

    if (!file) {
      return;
    }

    if (!fs.existsSync(file)) {
      return;
    }

    const stat = fs.statSync(file);

    if (this.lastUpdate < stat.mtimeMs) {
      this.lastUpdate = stat.mtimeMs;
      this.loadClips();
    }
  }

  /** Load clipboard history from disk or legacy global state. */
  public loadClips(): void {
    let json: string | Buffer | undefined;

    const file = this.getStoreFile();

    if (file && fs.existsSync(file)) {
      try {
        json = fs.readFileSync(file);
        this.lastUpdate = fs.statSync(file).mtimeMs;
      } catch {
        // Ignore read errors
      }
    } else {
      // Read from old storage
      const legacy = this.context.globalState.get<string>("clips");
      if (legacy) {
        json = legacy;
      }
    }

    if (!json) {
      return;
    }

    let stored: ClipboardStore;

    try {
      stored = JSON.parse(String(json)) as ClipboardStore;
    } catch (error: unknown) {
      console.log(error);
      return;
    }

    if (!stored.version || !stored.clips) {
      return;
    }

    let clips = stored.clips;

    // Migrate v1 format to v2
    if (stored.version === 1) {
      clips = clips.map(c => ({
        ...c,
        createdAt: c.timestamp ?? c.createdAt,
        copyCount: c.copyCount || 1,
        useCount: c.useCount || 0,
      }));
    }

    this._clips = clips.map(c => {
      const clip: IClipboardItem = {
        value: c.value,
        createdAt: c.createdAt,
        copyCount: c.copyCount,
        useCount: c.useCount,
        language: c.language,
      };

      if (c.createdLocation) {
        const uri = vscode.Uri.parse(c.createdLocation.uri);
        const range = new vscode.Range(
          c.createdLocation.range.start.line,
          c.createdLocation.range.start.character,
          c.createdLocation.range.end.line,
          c.createdLocation.range.end.character
        );
        clip.createdLocation = new vscode.Location(uri, range);
      }

      return clip;
    });

    this._onDidClipListChange.fire();
  }

  public dispose(): void {
    for (const d of this._disposable) {
      d.dispose();
    }
  }
}

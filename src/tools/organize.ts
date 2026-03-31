/**
 * Clipboard Manager - Package organization tool.
 * Sorts commands, keybindings, settings, and dependencies in package.json.
 * Also updates the README.md settings section.
 *
 * @author Eno Yao
 */

import * as fs from "fs";
import * as path from "path";

// ── Interfaces ───────────────────────────────────────────────────────────────

interface CommandItem {
  command: string;
  [key: string]: unknown;
}

interface ConfigurationProperty {
  type?: string | string[];
  default?: unknown;
  description?: string;
  scope?: string;
  [key: string]: unknown;
}

interface IPackage {
  [key: string]: unknown;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  contributes: {
    [key: string]: unknown;
    commands: CommandItem[];
    menus: {
      commandPalette: CommandItem[];
      [key: string]: unknown;
    };
    keybindings: CommandItem[];
    configuration: Array<{
      title: string;
      properties: Record<string, ConfigurationProperty>;
    }>;
  };
}

// ── Utility Functions ────────────────────────────────────────────────────────

/** Sort the keys of an object in place (alphabetically). */
function sortObjectKeys(obj: Record<string, unknown>): void {
  const clone = { ...obj };

  for (const key of Object.keys(clone).sort()) {
    delete obj[key];
    obj[key] = clone[key];
  }
}

/** Replace a substring within a string by start/end indices. */
function replaceStringRange(
  s: string,
  start: number,
  end: number,
  substitute: string
): string {
  return s.substring(0, start) + substitute + s.substring(end);
}

/** Compare two command items by their `command` field. */
const sortByCommand = (a: CommandItem, b: CommandItem): number =>
  a.command.localeCompare(b.command);

// ── Format package.json ──────────────────────────────────────────────────────

const packageFile = path.join(__dirname, "..", "..", "package.json");

let packageJson = fs.readFileSync(packageFile, { encoding: "utf8" });

const packageData = JSON.parse(packageJson) as IPackage;

packageData.contributes.commands.sort(sortByCommand);
packageData.contributes.menus.commandPalette.sort(sortByCommand);
packageData.contributes.keybindings.sort(sortByCommand);

const configProps = packageData.contributes.configuration[0];
if (configProps) {
  sortObjectKeys(configProps.properties as Record<string, unknown>);
}
sortObjectKeys(packageData.scripts as Record<string, unknown>);
sortObjectKeys(packageData.devDependencies as Record<string, unknown>);
sortObjectKeys(packageData.dependencies as Record<string, unknown>);

packageJson = JSON.stringify(packageData, null, 4) + "\n";

fs.writeFileSync(packageFile, packageJson, { encoding: "utf8" });

// ── Format README.md settings section ────────────────────────────────────────

const settings: string[] = [];

if (configProps) {
  const settingKeys = Object.keys(configProps.properties);

  for (const key of settingKeys) {
    const s = configProps.properties[key];

    if (!s) {
      continue;
    }

    let desc = "";

    // Turn description into a comment
    if (s.description) {
      desc += "  // " + s.description.replace(/\n/g, "\n  // ") + "\n";
    }

    desc +=
      "  " + JSON.stringify(key) + ": " + JSON.stringify(s.default ?? null);

    settings.push(desc);
  }
}

const readmeFile = path.join(__dirname, "..", "..", "README.md");
let readmeContent = fs.readFileSync(readmeFile, { encoding: "utf8" });

const settingsBegin = readmeContent.indexOf("<!--begin-settings-->") + 21;
const settingsEnd = readmeContent.indexOf("<!--end-settings-->");

readmeContent = replaceStringRange(
  readmeContent,
  settingsBegin,
  settingsEnd,
  "\n```js\n{\n" + settings.join(",\n\n") + "\n}\n```\n"
);

fs.writeFileSync(readmeFile, readmeContent, { encoding: "utf8" });

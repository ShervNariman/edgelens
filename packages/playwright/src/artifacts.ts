import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArtifactBudget, ScenarioArtifact } from "@motionguard/core";

export class ArtifactRecorder {
  private screenshots = 0;
  private totalBytes = 0;
  private readonly artifacts: ScenarioArtifact[] = [];

  constructor(
    private readonly dir: string,
    private readonly budget: ArtifactBudget,
  ) {}

  get recorded(): readonly ScenarioArtifact[] {
    return this.artifacts;
  }

  async ensureDir(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  canAdd(kind: ScenarioArtifact["kind"], bytes: number): boolean {
    if (this.artifacts.length >= this.budget.maxArtifacts) {
      return false;
    }
    if (this.totalBytes + bytes > this.budget.maxArtifactBytes) {
      return false;
    }
    if (kind === "screenshot" && this.screenshots >= this.budget.maxScreenshots) {
      return false;
    }
    return true;
  }

  async writeJson(name: string, value: unknown): Promise<ScenarioArtifact | null> {
    const payload = `${JSON.stringify(value, null, 2)}\n`;
    const bytes = Buffer.byteLength(payload, "utf8");
    if (!this.canAdd("json", bytes)) {
      return null;
    }
    await this.ensureDir();
    const filePath = path.join(this.dir, name);
    await writeFile(filePath, payload, "utf8");
    return this.track({ kind: "json", name, path: filePath, bytes });
  }

  async writeLog(name: string, lines: readonly string[]): Promise<ScenarioArtifact | null> {
    const capped = lines.slice(0, this.budget.maxLogEntries);
    const payload = `${capped.join("\n")}\n`;
    const bytes = Buffer.byteLength(payload, "utf8");
    if (!this.canAdd("log", bytes)) {
      return null;
    }
    await this.ensureDir();
    const filePath = path.join(this.dir, name);
    await writeFile(filePath, payload, "utf8");
    return this.track({ kind: "log", name, path: filePath, bytes });
  }

  trackScreenshot(name: string, filePath: string, bytes: number): ScenarioArtifact | null {
    if (!this.canAdd("screenshot", bytes)) {
      return null;
    }
    this.screenshots += 1;
    return this.track({ kind: "screenshot", name, path: filePath, bytes });
  }

  private track(artifact: ScenarioArtifact): ScenarioArtifact {
    this.artifacts.push(artifact);
    this.totalBytes += artifact.bytes;
    return artifact;
  }
}

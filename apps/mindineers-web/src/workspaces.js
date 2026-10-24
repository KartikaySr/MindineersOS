// Compatibility facade for existing screens. Persistence is implemented and
// type-checked in the shared repository; no duplicate storage logic lives here.
export {
  LEGACY_KEY,
  workspaceKey,
  readIndex,
  writeIndex,
  readWorkspace,
  saveWorkspace,
} from "./shared/services/workspace-repository.ts";

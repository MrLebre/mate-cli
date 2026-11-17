// A strict external plugin, typechecked by `src/plugin-api.test.ts`.
import type {
  CapabilityPlugin,
  CreatePlugin,
  PluginLifecycle,
} from "@uniqbit/mate-core/plugin-api";

const identity = {
  id: "acme",
  kind: "capability",
  label: "Acme",
  description: "Acme hooks",
  defaultSelected: false,
  isEnabled: () => true,
} as const;

// @ts-expect-error a plugin must declare `lifecycle`
export const withoutLifecycle: CapabilityPlugin = { ...identity };

export const hubWithoutTeardown: CapabilityPlugin = {
  ...identity,
  // @ts-expect-error a declared scope needs both handlers
  lifecycle: { hub: { async apply() {} } },
};

const companion: PluginLifecycle = { async apply() {}, async teardown() {} };

const createPlugin: CreatePlugin = (_config, host) => {
  const capability: CapabilityPlugin = {
    ...identity,
    lifecycle: { companion },
    cliCommands: [
      {
        name: "check",
        description: "Checks acme",
        async run() {
          await host.ensureCapabilityEnabled("acme");
        },
      },
    ],
    getRuntimeContributions: () => ({
      claude: {
        hookMarkers: ["acme-legacy-hook"],
        hookGroups: [
          {
            event: "PostToolUse",
            marker: "acme-hook",
            group: {
              matcher: "Bash",
              hooks: [{ type: "command", command: "acme-hook run", if: "Bash(git *)" }],
            },
          },
        ],
      },
    }),
  };
  return capability;
};

export default createPlugin;

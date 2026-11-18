import type { Config } from "@react-router/dev/config";

// Server rendering keeps public reading and voting working without JavaScript.
export default { ssr: true } satisfies Config;

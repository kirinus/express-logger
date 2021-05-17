export declare const env: Readonly<{
    ENVIRONMENT: string;
    LOG_LEVEL: "debug" | "error" | "warn" | "help" | "data" | "info" | "prompt" | "http" | "verbose" | "input" | "silly";
    NODE_ENV: string;
    VERSION: "unknown";
}> & import("envalid").CleanEnv & {
    readonly [varName: string]: string | undefined;
};
export declare const isKubernetesEnv: boolean;

import {Extension, Repo} from "./repo";
import {CollectionConfig} from "../collections";
import {Context} from "../types";

declare const repoRegistry: {
    [name: string]: Repo;
};
export function clearTableRegistry(): void;
export function repoFactory({ extensions, ...collectionConfig }: {
    extensions: Extension[];
} & CollectionConfig, context: Context): Repo;

export function addContext(context: Context): {
    [key: string]: any;
};
export function ready(cb: (err?: Error) => void): Promise<undefined> | undefined;
export function isRegistryReady(): boolean;
export { repoRegistry as tableRegistry };

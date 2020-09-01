import {RepoInstance} from "@spencejs/spence-mongo-repos/types/repos/repo";
import {Document} from "@spencejs/spence-mongo-repos/types/types";

export interface Overrides {
    [key: string]: any
}

export type GetOrBuildFn = (property: string, valFactory: Factory | GeneratorFn, ...valFactoryArgs: any[]) => Promise<Document | undefined | null>
export type BaseFactoryFn = (overrides: () => Overrides, helpers: { getOrBuild: GetOrBuildFn }, rawOverrides: Overrides) => Document
export type GeneratorFn = (rawOverrides: Overrides) => Document | Promise<Document>;

export type Factory = {
    name: string;
    capitalizedName: string;
} & {
    [generatorName: string]: GeneratorFn;
};

export function register<T>(name: string, repo: RepoInstance, baseFactory: BaseFactoryFn): Factory;

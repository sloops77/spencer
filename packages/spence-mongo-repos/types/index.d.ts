/// <reference types="node" />
export {default as initCollection} from "./collections";
export {default as reposPlugin} from "./repos/repos-pre-handler";
export {default as initRepo} from "./repos/repo";
export {repoFactory, ready, clearTableRegistry, addContext as bindRepo} from "./repos/repo-registry";
export { default as autoboxIdsExtension } from "./extensions/autoboxIdsExtension";
export * from "./mongodb";

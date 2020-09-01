import {RepoInstance} from "../repos/repo";

export default autoboxIdExtension;

declare function autoboxIdExtension<T extends RepoInstance, U extends T>(parent: T): U;

export default initPrepModification;

export type KindOfModification = "insert" | "update"

export type PrepModification = (val: Document, kind: KindOfModification) => Document

declare function initPrepModification(collection: import("../collections").Collection): PrepModification;

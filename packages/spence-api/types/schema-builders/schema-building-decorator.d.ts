import {FastifyPlugin} from "../types";
declare function schemaBuildingDecorator(sourcePlugin: FastifyPlugin, { tag }?: { tag?: string; }): FastifyPlugin

export default schemaBuildingDecorator;

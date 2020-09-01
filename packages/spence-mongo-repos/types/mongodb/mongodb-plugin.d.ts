/// <reference types="node" />
type FastifyInstance = import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>;

declare function mongodbPlugin(instance: FastifyInstance & {config: object}, options: any, callback: (err?: import("fastify").FastifyError) => void): void;
export default mongodbPlugin;

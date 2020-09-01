/// <reference types="node" />
type FastifyInstance = import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>;

declare function reposPreHandler(instance: FastifyInstance, options: any, callback: (err?: import("fastify").FastifyError) => void): void;
export default reposPreHandler;
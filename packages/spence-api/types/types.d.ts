export type Schema = {
    $schema?: string;
    type: string;
    description?: string;
    $id: string;
    properties?: any;
    allOf?: any[];
    oneOf?: any[];
    anyOf?: any[];
    additionalProperties?: boolean;
};
export type IdSchema = {
    $schema?: string;
    type: string;
    $id: string;
    properties: {
        id: {
            type: string;
        };
    };
};
export type HttpError = {
    type: string;
    $id: string;
    properties: {
        error: {
            type: string;
        };
        message: {
            type: string;
        };
        statusCode: {
            type: string;
        };
    };
    additionalProperties: boolean;
};

export type SuccessCode = "200" | "201" | "202" | "203" | "204";

export type FastifyPlugin = (instance: import("fastify").FastifyInstance<import("http").Server, import("http").IncomingMessage, import("http").ServerResponse>, options: any, callback: (err?: import("fastify").FastifyError) => void) => void

import {HttpError, Schema, SuccessCode} from "../types";

export default responseSchemaBuilder;

export type ErrorResponses = {
    400: HttpError;
    500: HttpError;
    404?: HttpError;
    401?: HttpError;
    403?: HttpError;
};

/**
 * Creates response schemas
 * @template T extends {[successCode in SuccessCode]: Schema}
 * @param success the success schema
 * @param options setting notFound generates a 404 response. setting authenticated generates 401 & 403 responses. default is true for both
 * @return success combined with the errors specified
 */
declare function responseSchemaBuilder<T extends {[successCode in SuccessCode]: Schema}>(success: T, { notFound, authenticated }?: {
    notFound?: boolean;
    authenticated?: boolean;
}): T & {
    400: HttpError;
    500: HttpError;
    404?: HttpError;
    401?: HttpError;
    403?: HttpError;
};

export type ResponseSchemaBuilder = typeof responseSchemaBuilder;


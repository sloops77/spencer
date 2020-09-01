export default deepCompactObj;
type PlainObject = {
    [name: string]: any;
};

declare function deepCompactObj(obj: PlainObject): PlainObject;

const { v1: uuidv1 } = require("uuid");
const { env } = require("@spencejs/spence-config");
const { publish, subscribe, disconnect, connect, setErrorHandler } = require("../src/events");
const { UUID_FORMAT } = require("../../spence-api/test/helpers/regexes");

describe("events", () => {
  const errorHandler = jest.fn();
  beforeAll(() => {
    setErrorHandler(errorHandler);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("publishing without any subscribers is fine", async () => {
    const result = await publish(`simple`, `created`, { aVal: "test" }, { userId: uuidv1() });
    expect(result).toEqual(undefined);
    expect(errorHandler).not.toHaveBeenCalled();
  });
  it("publishing should send an event to multiple subscribers", async () => {
    const subscribers = [jest.fn(), jest.fn(() => 1), jest.fn(() => Promise.resolve(1))];
    subscribe(`simple`, `created`, subscribers[0]);
    subscribe(`simple`, `created`, subscribers[1]);
    subscribe(`simple`, `created`, subscribers[2]);
    const payload = { aVal: "test" };
    const context = { userId: uuidv1(), source: env.source };
    const result = await publish(`simple`, `created`, payload, context);
    expect(result).toEqual(undefined);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(subscribers[0]).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
    expect(subscribers[1]).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
    expect(subscribers[2]).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
  });
  it("errors that are generated in a subscriber calls the errorHandler", async () => {
    const subscriber = jest.fn(() => {
      throw new Error("message");
    });
    subscribe(`simple`, `created`, subscriber);
    const payload = { aVal: "test" };
    const context = { userId: uuidv1(), source: env.source };
    const result = await publish(`simple`, `created`, payload, context);
    expect(result).toEqual(undefined);
    expect(errorHandler).toHaveBeenCalledWith(
      {
        payload,
        meta: {
          ...context,
          eventName: "created",
          id: expect.stringMatching(UUID_FORMAT),
          source: "spence-node",
          topic: "simple",
        },
      },
      context,
      new Error("message"),
    );
    expect(subscriber).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
  });
  it("disconnecting should prevent sending events to subscribers", async () => {
    disconnect(`simple.created`);
    const subscriber = jest.fn();
    subscribe(`simple`, `created`, subscriber);
    const payload = { aVal: "test" };
    const context = { userId: uuidv1() };
    const result = await publish(`simple`, `created`, payload, context);
    expect(result).toEqual(undefined);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(subscriber).not.toHaveBeenCalled();
  });
  it("reconnecting should reenable sending events to subscribers", async () => {
    disconnect(`simple.created`);
    connect(`simple.created`);
    const subscriber = jest.fn();
    subscribe(`simple`, `created`, subscriber);
    const payload = { aVal: "test" };
    const context = { userId: uuidv1(), source: env.source };
    const result = await publish(`simple`, `created`, payload, context);
    expect(result).toEqual(undefined);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
  });

  it("reconnecting using * reenable sending events to subscribers", async () => {
    disconnect(`simple.created`);
    connect();
    const subscriber = jest.fn();
    subscribe(`simple`, `created`, subscriber);
    const payload = { aVal: "test" };
    const context = { userId: uuidv1(), source: env.source };
    const result = await publish(`simple`, `created`, payload, context);
    expect(result).toEqual(undefined);
    expect(errorHandler).not.toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledWith({
      payload,
      meta: {
        ...context,
        eventName: "created",
        id: expect.stringMatching(UUID_FORMAT),
        source: "spence-node",
        topic: "simple",
      },
    });
  });
});

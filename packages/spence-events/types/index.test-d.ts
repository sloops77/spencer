import {expectType} from "tsd";
import {initEvents, publish, subscribe} from "../src";

expectType<void>(initEvents({errorHandler: (a, b, c) => "test", log: console}));
expectType<void>(await publish("topic", "event", {foo: "bar"}, {user: "fred", userId: "123", log: console}));
expectType<void>(await subscribe("topic", "event", (event) => {console.log(event)}));


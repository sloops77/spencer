class DeferredResult {
  constructor(builder, interceptors = []) {
    this.builder = builder;
    this.interceptors = interceptors;
  }

  mapResult(...args) {
    return new DeferredResult(this.builder, [...this.interceptors, ["then", args]]);
  }

  catchResult(...args) {
    return new DeferredResult(this.builder, [...this.interceptors, ["catch", args]]);
  }

  toBuilder() {
    return this.builder;
  }

  resolve() {
    let result = this.builder.then();

    this.interceptors.forEach((interceptor) => {
      result = result[interceptor[0]](...interceptor[1]);
    });

    return result;
  }

  then(...args) {
    return this.resolve().then(...args);
  }

  catch(...args) {
    return this.resolve().catch(...args);
  }

  finally(...args) {
    return this.resolve().finally(...args);
  }
}

module.exports = DeferredResult;

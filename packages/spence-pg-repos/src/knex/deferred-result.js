class DeferredResult {
  constructor(state, interceptors = []) {
    this.state = state;
    this.interceptors = interceptors;
    this.promise = null;
  }

  mapResult(...args) {
    return new DeferredResult(this.state, [...this.interceptors, ["then", args]]);
  }

  catchResult(...args) {
    return new DeferredResult(this.state, [...this.interceptors, ["catch", args]]);
  }

  toBuilder() {
    return this.state.builder;
  }

  resolve() {
    if (this.promise) {
      return this.promise;
    }

    if (!this.state.basePromise) {
      this.state.basePromise = this.state.builder.then();
    }

    let result = this.state.basePromise;

    this.interceptors.forEach((interceptor) => {
      result = result[interceptor[0]](...interceptor[1]);
    });

    this.promise = result;

    return this.promise;
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

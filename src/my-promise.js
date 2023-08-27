const PENDING = Symbol('pending');
const FULFILLED = Symbol('fulfilled');
const REJECTED = Symbol('rejected');

module.exports = class MyPromise {
  status = PENDING;
  value = null;
  reason = null;
  fulfilledCallbacks = [];
  rejectedCallbacks = [];

  resolve(value) {
    if (this.status === PENDING) {
      this.status = FULFILLED;
      this.value = value;
      this.fulfilledCallbacks.forEach((cb) => cb(this.value));
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.rejectedCallbacks.forEach((cb) => cb(this.reason));
    }
  }

  // [[Resolve]] 方法
  // 1. 如果 x 是个 promise 对象 / 类 promise 对象，那就要调用它的then方法，递归执行[[Resovle]]
  // 2. 是其他值直接 resolve 传递下去
  //  promise : 新的 promise 对象
  //  x: 原 promise 对象 onFulfilled 执行返回值
  resolvePromise(promise, x, resolve, reject) {
    // promise x 指向同一对象
    // 防止死循环
    if (promise === x) {
      return reject(new TypeError('The promise and the return value are the same'));
    }

    // 返回值 x 是 promise 对象
    if (x instanceof MyPromise) {
      x.then((y) => {
        this.resolvePromise(promise, y, resolve, reject);
      }, reject);
    }
    // x 是对象或者函数
    else if (typeof x === 'object' || typeof x === 'function') {
      if (x == null) return resolve(x);

      let then = null;
      try {
        then = x.then;
      } catch (err) {
        return reject(err);
      }

      // thenable 对象
      if (typeof then === 'function') {
        // 防止被多次调用；
        let called = false;
        try {
          then.call(
            x,
            (y) => {
              if (called) return;
              called = true;
              this.resolvePromise(promise, y, resolve, reject);
            },
            (r) => {
              if (called) return;
              called = true;
              reject(r);
            }
          );
        } catch (err) {
          if (called) return;

          reject(err);
        }
      }
      // 不是thenable
      else {
        resolve(x);
      }
    }
    // 不是对象或者函数
    else {
      resolve(x);
    }
  }

  then(onFulfilled, onRejected) {
    // 确保传入的函数
    let realFulfilled = onFulfilled;
    if (typeof realFulfilled !== 'function') {
      realFulfilled = function (value) {
        return value;
      };
    }

    let realRejected = onRejected;
    if (typeof realRejected !== 'function') {
      realRejected = function (value) {
        return value;
      };
    }

    let promise = null;

    // 1. 当前 promise 对象执行成功
    if (this.status === FULFILLED) {
      promise = new MyPromise((resolve, reject) => {
        // 确保异步执行
        setTimeout(() => {
          try {
            // 1.1 onFulfilled 不是一个函数
            //     需要新的promise 对象 resolve 相同的值
            //     Promise 穿透
            if (typeof onFulfilled !== 'function') {
              resolve(this.value);
            } else {
            // 1.2 onFulfilled 是一个函数，执行它
            //     取到返回值，对返回值调用 [[Resolve]](promise, x) 方法进行 resolve
              const x = realFulfilled(this.value);
              this.resolvePromise(promise, x, resolve, reject);
            }
          } catch (err) {
            // 1.3 onFulfilled 执行出错，reject 错误原因
            reject(err);
          }
        }, 0);
      });

      // 链式调用
      return promise;
    }
    if (this.status === REJECTED) {
      promise = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') {
              reject(this.reason);
            } else {
              const x = realRejected(this.reason);
              this.resolvePromise(promise, x, resolve, reject);
            }
          } catch (err) {
            reject(err);
          }
        }, 0);
      });
      return promise;
    }
    if (this.status === PENDING) {
      // 还在pending 加入回调队列
      promise = new MyPromise((resolve, reject) => {
        this.fulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              if (typeof onFulfilled !== 'function') {
                resolve(this.value);
              } else {
                const x = realFulfilled(this.value);
                this.resolvePromise(promise, x, resolve, reject);
              }
            } catch (err) {
              reject(err);
            }
          }, 0);
        });

        this.rejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              if (typeof onRejected !== 'function') {
                reject(this.reason);
              } else {
                const x = realRejected(this.reason);
                this.resolvePromise(promise, x, resolve, reject);
              }
            } catch (err) {
              reject(err);
            }
          }, 0);
        });
      });

      return promise;
    }
  }

  constructor(fn) {
    this.status = PENDING;
    this.value = null;
    this.reason = null;

    // 绑定一下，防止this丢失
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);

    try {
      fn(this.resolve, this.reject);
    } catch (err) {
      this.reject(err);
    }
  }
};

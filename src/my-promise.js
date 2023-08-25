const PENDING = Symbol('pending')
const FULFILLED = Symbol('fulfilled');
const REJECTED  = Symbol('rejected');

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
      this.fulfilledCallbacks.forEach(cb => cb(this.value));
    }
  }

  reject(reason) {
    if (this.status === PENDING) {
      this.status = REJECTED;
      this.reason = reason;
      this.rejectedCallbacks.forEach(cb => cb(this.reason));
    }
  }

  resolvePromise(promise, x, resolve, reject) {
    // promise x 指向同一对象
    if (promise === x) {
      return reject(new TypeError('The promise and the return value are the same'));
    }

    // x 是 promise 对象
    if (x instanceof MyPromise) {
      x.then((y) => {
        this.resolvePromise(promise, y, resolve, reject);
      }, reject)
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
          )
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
      }
    }

    let realRejected = onRejected;
    if (typeof realRejected !== 'function') {
      realRejected = function (value) {
        return value;
      }
    }

    let promise = null;

    if (this.status === FULFILLED) {
      promise = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (typeof onFulfilled !== 'function') {
              resolve(this.value);
            }
            else {
              const x = realFulfilled(this.value);
              this.resolvePromise(promise, x, resolve, reject);
            }
          } catch(err) {
            reject(err)
          }
        }, 0)
      })
      
    // 链式调用
    return promise;
    }
    if (this.status === REJECTED) {
      promise = new MyPromise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') {
              reject(this.reason);
            }else {
              const x = realRejected(this.reason);
              this.resolvePromise(promise, x, resolve, reject);
            }
          } catch(err) {
            reject(err);
          }
        }, 0)
      })
      return promise;
    }
    if (this.status === PENDING) {
      // 还在pending 加入回调队列
      promise = new MyPromise((resolve, reject) => {
        this.fulfilledCallbacks.push(
          () => {
            setTimeout(() => {
              try {
                if (typeof onFulfilled !== 'function') {
                  resolve(this.value);
                }
                else {
                  const x = realFulfilled(this.value);
                  this.resolvePromise(promise, x, resolve, reject);
                }
              } catch(err) {
                reject(err)
              }
            }, 0)
          }
        )

        this.rejectedCallbacks.push(
          () => {
            setTimeout(() => {
              try {
                if (typeof onRejected !== 'function') {
                  reject(this.reason);
                }else {
                  const x = realRejected(this.reason);
                  this.resolvePromise(promise, x, resolve, reject);
                }
              } catch(err) {
                reject(err);
              }
            }, 0)
          }
        )
      })

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
    } catch(err) {
      this.reject(err);
    }
  }
}
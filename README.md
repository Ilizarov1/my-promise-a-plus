# 手撕 Promise / Promise A+
个人学习用
参考：https://segmentfault.com/a/1190000023157856

![test-result](/test-result.png)

# Promise / Promise A+

> Promise/A+规范: [https://github.com/promises-aplus/promises-spec](https://link.segmentfault.com/?enc=JTbGuU2SWgfVkwjOyYDy%2BQ%3D%3D.O5V8wGiDpRdEF4zNYVMKlStlY9hYLzrGRh03woU60QFI4LhTQbN30B7SIr3TIRrn)
>
> Promise/A+测试工具: [https://github.com/promises-aplus/promises-tests](https://link.segmentfault.com/?enc=uZpy%2BZj4uOKdDYq6hRy3yA%3D%3D.%2FoGyF6w0Xbnmk6EV4mVo1qqf6xZpG3EqO%2FtN9uYfPY0WJd98UQCyNRdkxYQ%2BmrFSd5gfCGy1uK6vOXoblG5ZCQ%3D%3D)

一种异步编程的解决方案

## 三种状态、两种生命周期

两种生命周期：pending -> settled

三种状态：pending -> fulfilled / rejected

状态 存储在 Promise 对象的 [[PromiseState]] 属性中

## thenable

Promise 一定有一个 then() 方法

then(onFulfilled, onRejected): Promise

## 如何实现链式调用？

实现的链式调用的核心是，then函数的返回值是一个promise对象

1. onFulfilled / onRejected 抛出异常 需要 在新的 promise 里 reject(error)
2. 执行 成功，新的 promise 必须返回相同的值
3. onFulfilled / onRejected 如果不是函数，需要透传值
4. onFulfilled / onRejected 执行的结果需要向后传递，如果是 thenable 对象则需要调用这个对象的 then 方法


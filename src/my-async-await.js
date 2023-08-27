async function fn() {
  // todo
}

// 等价于

function fnWithGen() {
  return run(function* () {
    // todo
  })
}

function run(genFn) {

  return new Promise((resolve, reject) => {
    let gen = genFn();
    let next = null;
    function step(nextFn) {
      try {
        next = nextFn();
      } catch(err) {
        reject(err);
      }
      if (next.done) {
        return resolve(next.value);
      }
      Promise.resolve(next.value).then((val) => {
        step(() => gen.next(val));
      }, (err) => {
        step(() => gen.throw(err));
      })
    }
    step(() => gen.next(undefined));
  })

}

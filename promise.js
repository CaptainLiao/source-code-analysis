var p = Promise.resolve('123')

p.then(() => {
  console.info('ddd')
})
p.then(r => console.info(r))



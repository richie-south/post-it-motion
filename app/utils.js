const cmd = require('node-cmd')

const alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const toAlphName = (alph, nr, name = '') =>
  nr > alph.length - 1
    ? toAlphName(
      alph,
      nr - alph.length,
      name + alph[alph.length - 1]
    )
    : name + alph[nr]

const createGif = (progressEmitter) => cmd.get(
  'cd images/out && convert -delay 0.170 -loop 0 *.jpg animated.gif',
  () => {
    progressEmitter.emit('tick')
  }
)

exports.toAlphName = (nr, name) =>
  toAlphName(alph, nr, name)
exports.createGif = createGif

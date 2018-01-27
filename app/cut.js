const {crop} = require('easyimage')
const fs = require('fs')
const EventEmitter = require('events')
const ProgressBar = require('progress')

class ProgressEmitter extends EventEmitter {}

const progressEmitter = new ProgressEmitter()
let bar

progressEmitter.on('tick', () => {
  bar.tick()
})

const alph = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const toAlphName = (alph, nr, name = '') =>
  nr > alph.length - 1
    ? toAlphName(
      alph,
      nr - alph.length,
      name + alph[alph.length - 1]
    )
    : name + alph[nr]

const startDir = './images/in'
const outDir = './images/out'
console.time()
fs.readdir(startDir, (err, dir) => {
  bar = new ProgressBar(':bar :current/:total :percent', {
    width: 50,
    complete: '■',
    incomplete: '-',
    total: (dir.length - 1),
  })


  dir.slice(1).map(async (imageName, index) =>
    await foo(
      toAlphName(alph, index),
      imageName,
    ))
})

const foo = async (name, imageName) => {
  try {

    await crop({
      src: `${startDir}/${imageName}`,
      cropHeight: 4032, // + -20,
      cropWidth: 3024, // + -20,
      x: 300, // : x + 10,
      y: 0, // : y + 10,
      dst: `${outDir}/${imageName}.jpg`,
    })

    progressEmitter.emit('tick')

  } catch (error) {
    /* console.log('error', error) */
  }
}

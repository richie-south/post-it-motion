const cv = require('opencv4nodejs')
const mulig = require('mulig')
const fs = require('fs')
const EventEmitter = require('events')
const ProgressBar = require('progress')
const gm = require('gm').subClass({imageMagick: true})
const async = require('async')
const {toAlphName, createGif} = require('./utils')
const {findPostItBounds: postItBounds} = require('./post-it-bounds')

class ProgressEmitter extends EventEmitter {}

const progressEmitter = new ProgressEmitter()
const startDir = './images/in'
const outDir = './images/out'
let bar

progressEmitter.on('tick', () => {
  bar.tick()
})

const findPostItBounds = postItBounds(progressEmitter)

const CropResQueue = async.queue(({imageName, name, height, width, x, y, isLast}, done) => {
  const streamIn = fs.createReadStream(`${startDir}/${imageName}`)
  const streamOut = fs.createWriteStream(`${outDir}/${name}.jpg`)
  gm(streamIn)
    .crop(width, height, x, y)
    .resize(500, 500, '!')
    .stream()
    .pipe(streamOut)
    .on('finish', () => {
      progressEmitter.emit('tick')
      done()
      if (isLast) {
        createGif(progressEmitter)
      }
    })
}, 10)

const postItBoundsQueue = async.queue(({image, name, imageName, isLast}, done) => {
  findPostItBounds(
    image,
    name,
    imageName,
    isLast
  )
    .then(({height, width, x, y, imageName, name, isLast}) => {
      done()
      CropResQueue.push({
        imageName,
        name,
        height,
        width,
        x,
        y,
        isLast,
      })
    })
}, 5)

fs.readdir(startDir, (err, dir) => {
  bar = new ProgressBar(':bar :current/:total :percent', {
    width: 50,
    complete: '■',
    incomplete: '-',
    total: ((dir.length - 1) * 6) + 1,
  })

  mulig(
    dir.slice(0).map((imageName) =>
      cv.imreadAsync(`${startDir}/${imageName}`)),
    (value, index, isDone) => {
      progressEmitter.emit('tick')
      postItBoundsQueue.push({
        image: value,
        name: toAlphName(index),
        imageName: dir[index],
        isLast: isDone,
      })
    },
    () => {
      // swallow errors
    }
  )
})

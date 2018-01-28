const cv = require('opencv4nodejs')
const mulig = require('mulig')
const fs = require('fs')
const EventEmitter = require('events')
const ProgressBar = require('progress')
const gm = require('gm').subClass({imageMagick: true})
const async = require('async')
const GIFEncoder = require('gifencoder')
const encoder = new GIFEncoder(500, 500)
const cmd = require('node-cmd')

encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'))

class ProgressEmitter extends EventEmitter {}
const progressEmitter = new ProgressEmitter()
let bar
progressEmitter.on('tick', () => {
  bar.tick()
})

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
        cmd.get(
          'cd images/out && convert -delay 0.170 -loop 0 *.jpg animated.gif',
          () => {
            progressEmitter.emit('tick')
            console.log('done')
          }
        )
      }
    })
}, 10)

const FooQueue = async.queue(({image, name, imageName, isLast}, done) => {
  foo(
    image,
    name,
    imageName,
    isLast
  ).then(() => {
    done()
  })
}, 5)

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
      FooQueue.push({
        image: value,
        name: toAlphName(alph, index),
        imageName: dir[index],
        isLast: isDone,
      })
    },
    () => {
      // console.log('error mulig', value)
    }
  )
})

const foo = async (image, name, imageName, isLast) => {
  try {
    const grayImage = await image.cvtColorAsync(cv.COLOR_BGR2GRAY)
    progressEmitter.emit('tick')

    const blurred = await grayImage.gaussianBlurAsync(new cv.Size(5, 5), 0)
    progressEmitter.emit('tick')

    const thresh = await blurred.thresholdAsync(60, 255, cv.THRESH_BINARY)
    progressEmitter.emit('tick')

    const cnts = await thresh.findContoursAsync(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    progressEmitter.emit('tick')

    const largestContours = cnts
      .sort((a, b) => {
        if (a.numPoints > b.numPoints) {
          return -1
        }
        if (a.numPoints < b.numPoints) {
          return 1
        }
        return 0
      })[0]

    const {height, width, x, y} = largestContours.boundingRect()

    CropResQueue.push({imageName, name, height, width, x, y, isLast})

    return true
  } catch (error) {
    /* console.log('error', error) */
  }
}

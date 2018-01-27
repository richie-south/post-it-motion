const cv = require('opencv4nodejs')
const {crop, resize} = require('easyimage')
const mulig = require('mulig')
const fs = require('fs')
const EventEmitter = require('events')
const ProgressBar = require('progress')

const GIFEncoder = require('gifencoder')
const encoder = new GIFEncoder(500, 500)
const pngFileStream = require('png-file-stream')

encoder.createReadStream().pipe(fs.createWriteStream('myanimated.gif'))

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
const cropedDir = './images/croped'
console.time()
fs.readdir(startDir, (err, dir) => {
  bar = new ProgressBar(':bar :current/:total :percent', {
    width: 50,
    complete: '■',
    incomplete: '-',
    total: ((dir.length - 1) * 7) + (dir.length - 1),
  })

  mulig(
    dir.slice(0).map((imageName) =>
      cv.imreadAsync(`${startDir}/${imageName}`)),
    (value, index, isDone) => {
      progressEmitter.emit('tick')
      foo(
        value,
        toAlphName(alph, index),
        dir[index],
        isDone
      )
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

    await crop({
      src: `${startDir}/${imageName}`,
      cropHeight: height, // + -20,
      cropWidth: width, // + -20,
      x, // : x + 10,
      y, // : y + 10,
      dst: `${cropedDir}/${name}.jpg`,
    })

    progressEmitter.emit('tick')

    await resize({
      onlyDownscale: true,
      width: 500,
      height: 500,
      ignoreAspectRatio: true,
      src: `${cropedDir}/${name}.jpg`,
      dst: `${outDir}/${name}.png`,
    })

    progressEmitter.emit('tick')

    if (isLast) {
      pngFileStream('images/out/*.png')
        .on('data', () => {
          progressEmitter.emit('tick')
        })
        .pipe(encoder.createWriteStream({ repeat: 0, delay: 120, quality: 10 }))
        .pipe(fs.createWriteStream('lingonsaft_typescript.gif'))
    }
  } catch (error) {
    /* console.log('error', error) */
  }
}

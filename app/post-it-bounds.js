const cv = require('opencv4nodejs')

const findPostItBounds = (progressEmitter) => async (image, name, imageName, isLast) => {
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
    return {height, width, x, y, imageName, name, isLast}
  } catch (error) {
    // swallow errors
  }
}

exports.findPostItBounds = findPostItBounds

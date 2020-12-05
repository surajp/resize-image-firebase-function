const functions = require("firebase-functions");
const fetch = require("node-fetch");
const sharp = require("sharp");

const runtimeOpts = {
  timeoutSeconds: 10,
  memory: "1GB",
};

exports.resizeImage = functions
  .runWith(runtimeOpts)
  .https.onRequest(async (req, resp) => {
    const imageUrl = req.query.url;
    const width = parseInt(req.query.width) || 100;
    const height = parseInt(req.query.height) || 40;
    let responseJson = {
      originalImageUrl: imageUrl,
      newWidth: width,
      newHeight: height,
    };
    functions.logger.log("url", imageUrl);
    fetch(imageUrl)
      .then((res) => res.buffer())
      .then((res) => {
        return sharp(res).resize({ height, width, fit: "fill" }).toBuffer();
      })
      .then((data) =>
        resp.json(
          Object.extend(responseJson, {
            resizedImage: data.toString("base64"),
          })
        )
      )
      .catch((err) => resp.json(Object.extend(responseJson, { error: err })));
  });

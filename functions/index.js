const functions = require("firebase-functions");
const fetch = require("node-fetch");
const sharp = require("sharp");
const html_to_pdf = require("html-pdf-node");
const cors = require("cors")({ origin: true });
const JSZip = require("jszip");

const runtimeOpts = {
  timeoutSeconds: 10,
  memory: "1GB",
};

exports.resizeImage = functions
  .runWith(runtimeOpts)
  .https.onRequest((req, resp) => {
    cors(req, resp, async () => {
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
            Object.assign(responseJson, {
              resizedImage: data.toString("base64"),
            })
          )
        )
        .catch((err) => resp.json(Object.assign(responseJson, { error: err })));
    });
  });

exports.genPdf = functions.runWith(runtimeOpts).https.onRequest((req, resp) => {
  cors(req, resp, async () => {
    let options = { format: "A4" };
    let file = { content: req.body.content };
    try {
      let pdfBuffer = await html_to_pdf.generatePdf(file, options);
      resp.json({ data: pdfBuffer.toString("base64") });
    } catch (err) {
      resp.json({ error: err });
    }
  });
});

exports.zipData = functions
  .runWith(runtimeOpts)
  .https.onRequest((req, resp) => {
    cors(req, resp, async () => {
      try {
        const files = req.body.files;
        const zip = new JSZip();
        console.log(JSON.stringify(files));
        files.forEach((f) => {
          zip.file(f.name, f.content);
        });
        const b64 = await zip.generateAsync({ type: "base64" });
        resp.json({ data: b64 });
      } catch (err) {
        resp.json({ error: JSON.stringify(err) });
      }
    });
  });

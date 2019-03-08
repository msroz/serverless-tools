// https://yosuke-furukawa.hatenablog.com/entry/2014/12/22/093559
const okrabyte = require("okrabyte");
const jimp = require("jimp");

'use strict';

const tempFile = '/tmp/target.png';

function errorResponse(status, errorMessage) {
  return _generateResponse(status, null, errorMessage);
}
function successResponse(value) {
  return _generateResponse(200, value, null);
}
function _generateResponse(statusCode, responseBody, errorMessage) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      result: responseBody,
      error: errorMessage,
    })
  };
}

function recognize(buffer) {
  return new Promise((resolve, reject) => {
    jimp.read(buffer).then(image => {
      image.getBuffer(jimp.MIME_PNG, (error, buffer) => {
        if (error) reject(error);

        okrabyte.decodeBuffer(buffer, (error, data) => {
          if (error) reject(error);
          resolve(data);
        });
      });
    }).catch(error => {
      reject(error);
    });
  });
}

exports.handler = async (event, context) => {
  console.log(event);
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch(error) {
    return errorResponse(400, 'Invalid request. requestBody must be JSON String.');
  }
  const base64String = requestBody.image_base64;

  if (!base64String || typeof base64String !== 'string') {
    return errorResponse(400, `image_base64 must be string. value:${base64String}`);
  }

  const data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buf = new Buffer(data, 'base64');

  let recognizedStr;
  try {
    recognizedStr = await recognize(buf);
  } catch(error) {
    console.error(error);
    return errorResponse(422, "Failed to recognize.");
  }

  const result = recognizedStr.replace(/[\x00-\x09\x0a-\x1f\x7f-\x9f]/g, '');
  console.log(`recognizedStr: ${recognizedStr} request: ${result}`);

  return successResponse(result);
};

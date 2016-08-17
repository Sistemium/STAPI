export default function (req, res, next) {
  var oldWrite = res.write,
    oldEnd = res.end;

  var chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);

    oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk)
      chunks.push(chunk);

    if (Buffer.isBuffer(chunk)) {
      res.body = Buffer.concat(chunks).toString('utf8');
    } else if (!chunk && chunks.length === 0) {
      res.body = {};
    } else {
      res.body = chunks.toString('utf8');
    }

    oldEnd.apply(res, arguments);
  };

  next();
}

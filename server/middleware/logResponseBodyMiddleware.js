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

    var body = Buffer.concat(chunks).toString('utf8');
    res.body = body;

    oldEnd.apply(res, arguments);
  };

  next();
}

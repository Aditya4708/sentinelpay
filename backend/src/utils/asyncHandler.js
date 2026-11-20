// Express 4 does not catch rejected promises from async handlers. Wrapping a handler
// forwards any rejection to the error middleware instead of leaving the request hanging
// (and, on Node 15+, crashing the process with an unhandled rejection).
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };

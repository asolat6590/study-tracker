function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

function isUniqueError(error) {
  return Boolean(error) && (
    error.errcode === 2067 || String(error.message).includes('UNIQUE constraint failed')
  );
}

function asyncHandler(handler) {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  badRequest,
  notFound,
  conflict,
  isUniqueError,
  asyncHandler,
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) console.error(`Unhandled request error [${req.requestId || "unknown"}]:`, err);
  return res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    ...(status >= 500 ? { requestId: req.requestId } : {}),
  });
};
export default errorHandler;

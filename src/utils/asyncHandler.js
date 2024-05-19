const asyncHandler = (fn)=>async (req, res, next) => {
     try {
          await fn(req, res, next);
     } catch (err) {
          res.status(err.status || 500).json({
               succes: false,
               message: err.message || "Internal Server Error"
          });
     }
}

export default asyncHandler;
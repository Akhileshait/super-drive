class ApiError extends Error {
     constructor(
          message="Something went wrong", 
          statuscode,
          errors=[],
          stacktrace
     ) {
          super(message);
          this.statuscode = statuscode;
          this.data = null;
          this.message = message;
          this.errors = errors;
          this.success = false;

          if(stacktrace) {
               this.stack = stacktrace;
          }else{
               Error.captureStackTrace(this, this.constructor);
          }
     }
}

export { ApiError};
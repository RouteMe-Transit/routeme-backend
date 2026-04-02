class ApiResponse {
  static success(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data, message = "Created successfully") {
    return this.success(res, data, message, 201);
  }

  static error(res, message = "An error occurred", statusCode = 500, errors = []) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors.length > 0 && { errors }),
    });
  }
}

module.exports = ApiResponse;

function validateFeedbackInput(req, res, next) {
  const { rating, timelinessRating, conductRating } = req.body;

  if (rating === undefined || rating === null) {
    return res.status(400).json({
      success: false,
      message: 'Overall rating is required (1 to 5)'
    });
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be an integer between 1 and 5'
    });
  }

  if (timelinessRating !== undefined && timelinessRating !== null) {
    const t = parseInt(timelinessRating, 10);
    if (isNaN(t) || t < 1 || t > 5) {
      return res.status(400).json({
        success: false,
        message: 'timelinessRating must be between 1 and 5'
      });
    }
  }

  if (conductRating !== undefined && conductRating !== null) {
    const c = parseInt(conductRating, 10);
    if (isNaN(c) || c < 1 || c > 5) {
      return res.status(400).json({
        success: false,
        message: 'conductRating must be between 1 and 5'
      });
    }
  }

  next();
}

module.exports = {
  validateFeedbackInput
};

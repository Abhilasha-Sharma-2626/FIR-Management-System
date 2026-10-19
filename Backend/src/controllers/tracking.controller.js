const trackingService = require('../services/tracking.service');

async function trackPublic(req, res, next) {
  try {
    const { trackingId } = req.params;
    const data = await trackingService.getPublicTrackingInfo(trackingId);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getTimeline(req, res, next) {
  try {
    const { id } = req.params;
    const timeline = await trackingService.getCaseTimeline(parseInt(id, 10), req.user);
    return res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
}

async function postFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const feedback = await trackingService.submitCitizenFeedback(
      parseInt(id, 10),
      req.user.citizenId,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. Thank you for helping improve police services.',
      data: feedback
    });
  } catch (error) {
    next(error);
  }
}

async function getFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const feedback = await trackingService.getCaseFeedback(parseInt(id, 10));
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'No feedback found for this case'
      });
    }
    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  trackPublic,
  getTimeline,
  postFeedback,
  getFeedback
};

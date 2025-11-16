// controllers/reportController.js
const Report = require('../models/Report');
const Call = require('../models/Call');
const azureACSService = require('../services/azureACSService');

class ReportController {
  // Submit a report
  async submitReport(req, res) {
    try {
      const { callId, issueType, description } = req.body;
      const reportedBy = req.user.id;

      const call = await Call.findOne({
        _id: callId,
        $or: [{ creator: reportedBy }, { participant: reportedBy }]
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      // Determine reported user (the other person in the call)
      const reportedUser = call.creator.toString() === reportedBy ? 
        call.participant : call.creator;

      // Create report
      const report = await Report.create({
        reportedBy,
        reportedUser,
        call: callId,
        issueType,
        description
      });

      // If call has recording, store it permanently
      if (call.recordingUrl && !call.isRecordingStored) {
        // Implement recording storage logic here
        // This would involve moving the recording from temporary to permanent storage
        call.isRecordingStored = true;
        await call.save();
      }

      res.json({
        success: true,
        message: 'Report submitted successfully',
        report
      });

    } catch (error) {
      console.error('Submit report error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Start recording for a call (only when reported)
  async startRecording(req, res) {
    try {
      const { callId } = req.params;

      const call = await Call.findOne({
        _id: callId,
        $or: [{ creator: req.user.id }, { participant: req.user.id }]
      });

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      if (call.status !== 'connected') {
        return res.status(400).json({
          success: false,
          message: 'Cannot record a call that is not connected'
        });
      }

      // Start recording in Azure ACS
      const recording = await azureACSService.startRecording(
        call.azureCallConnectionId,
        call.moment
      );

      call.recordingId = recording.recordingId;
      await call.save();

      res.json({
        success: true,
        message: 'Recording started',
        recordingId: recording.recordingId
      });

    } catch (error) {
      console.error('Start recording error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ReportController();
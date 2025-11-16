// controllers/callCallbackController.js
const Call = require('../models/Call');
const Moment = require('../models/Moment');

class CallCallbackController {
  // Handle Azure ACS call events
  async handleCallEvent(req, res) {
    try {
      const { eventType, callConnectionId, momentId } = req.body;

      switch (eventType) {
        case 'CallConnected':
          await this.handleCallConnected(callConnectionId, momentId);
          break;
        case 'CallDisconnected':
          await this.handleCallDisconnected(callConnectionId);
          break;
        case 'RecordingStateChanged':
          await this.handleRecordingStateChanged(req.body);
          break;
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Call callback error:', error);
      res.status(500).send('Error');
    }
  }

  async handleCallConnected(callConnectionId, momentId) {
    // Update call status to connected
    await Call.findOneAndUpdate(
      { azureCallConnectionId: callConnectionId },
      { status: 'connected', startTime: new Date() }
    );
  }

  async handleCallDisconnected(callConnectionId) {
    const call = await Call.findOne({ azureCallConnectionId: callConnectionId });
    
    if (call && call.status !== 'completed') {
      // Calculate duration (max 30 seconds)
      const now = new Date();
      const duration = Math.min(Math.floor((now - call.startTime) / 1000), 30);

      call.endTime = now;
      call.duration = duration;
      call.status = 'completed';
      await call.save();

      // Update moment availability
      if (call.moment) {
        const moment = await Moment.findById(call.moment);
        if (moment) {
          moment.currentCall = null;
          moment.isAvailable = moment.expiresAt > new Date();
          await moment.save();
        }
      }
    }
  }

  async handleRecordingStateChanged(eventData) {
    if (eventData.recordingState === 'active') {
      // Store recording ID
      await Call.findOneAndUpdate(
        { azureCallConnectionId: eventData.callConnectionId },
        { recordingId: eventData.recordingId }
      );
    }
  }
}

module.exports = new CallCallbackController();
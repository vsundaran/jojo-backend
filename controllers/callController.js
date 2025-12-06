// // controllers/callController.js
// const Call = require('../models/Call');
// const Moment = require('../models/Moment');
// const User = require('../models/User');
// const azureACSService = require('../services/azureACSService');
// const { v4: uuidv4 } = require('uuid');

// class CallController {
//   // Initiate a call for Give Joy
//   async initiateCall(req, res) {
//     try {
//       const { category } = req.body;
//       const participantId = req.user.id;

//       // Find an available moment matching the category
//       const availableMoment = await Moment.findOne({
//         category,
//         status: 'active',
//         isAvailable: true,
//         expiresAt: { $gt: new Date() },
//         currentCall: { $exists: false },
//         creator: { $ne: participantId }
//       }).populate('creator');

//       if (!availableMoment) {
//         return res.status(404).json({
//           success: false,
//           message: 'No available moments found for this category'
//         });
//       }

//       // Create call record
//       const call = await Call.create({
//         callId: uuidv4(),
//         moment: availableMoment._id,
//         creator: availableMoment.creator._id,
//         participant: participantId,
//         category: availableMoment.category,
//         subCategory: availableMoment.subCategory,
//         languages: availableMoment.languages,
//         status: 'initiated'
//       });

//       // Update moment with current call
//       availableMoment.currentCall = call._id;
//       availableMoment.isAvailable = false;
//       await availableMoment.save();

//       // Create Azure ACS identities and tokens
//       const creatorIdentity = await azureACSService.createUserIdentity();
//       const participantIdentity = await azureACSService.createUserIdentity();

//       console.log('Creator identity:', creatorIdentity.communicationUserId);
//       console.log('Participant identity:', participantIdentity.communicationUserId);

//       const creatorToken = await azureACSService.getToken(creatorIdentity.communicationUserId);
//       const participantToken = await azureACSService.getToken(participantIdentity.communicationUserId);

//       // Initiate call using Azure ACS
//       const callConnection = await azureACSService.createCall(
//         creatorIdentity.communicationUserId,
//         participantIdentity.communicationUserId,
//         availableMoment._id
//       );

//       // Update call with Azure details
//       call.azureCallConnectionId = callConnection.callConnectionId;
//       call.startTime = new Date();
//       call.status = 'connected';
//       await call.save();

//       // Increment call counts
//       await User.findByIdAndUpdate(availableMoment.creator._id, {
//         $inc: { callCount: 1 }
//       });
//       await User.findByIdAndUpdate(participantId, {
//         $inc: { callCount: 1 }
//       });
//       await Moment.findByIdAndUpdate(availableMoment._id, {
//         $inc: { callCount: 1 }
//       });

//       res.json({
//         success: true,
//         message: 'Call initiated successfully',
//         call: {
//           id: call._id,
//           callId: call.callId,
//           moment: availableMoment,
//           creatorToken: creatorToken.token,
//           participantToken: participantToken.token,
//           azureCallConnectionId: callConnection.callConnectionId
//         }
//       });

//     } catch (error) {
//       console.error('Initiate call error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       });
//     }
//   }

//   // End a call
//   async endCall(req, res) {
//     try {
//       const { callId } = req.params;
//       const userId = req.user.id;

//       const call = await Call.findOne({
//         callId,
//         $or: [{ creator: userId }, { participant: userId }]
//       }).populate('moment');

//       if (!call) {
//         return res.status(404).json({
//           success: false,
//           message: 'Call not found'
//         });
//       }

//       if (call.status === 'completed') {
//         return res.status(400).json({
//           success: false,
//           message: 'Call already completed'
//         });
//       }

//       // Calculate duration (max 30 seconds)
//       const now = new Date();
//       const duration = Math.min(Math.floor((now - call.startTime) / 1000), 30);

//       call.endTime = now;
//       call.duration = duration;
//       call.status = 'completed';
//       await call.save();

//       // Update moment availability
//       if (call.moment) {
//         call.moment.currentCall = null;
//         call.moment.isAvailable = call.moment.expiresAt > new Date();
//         await call.moment.save();
//       }

//       // Hang up call in Azure ACS
//       if (call.azureCallConnectionId) {
//         await azureACSService.hangUpCall(call.azureCallConnectionId);
//       }

//       res.json({
//         success: true,
//         message: 'Call ended successfully',
//         call: {
//           id: call._id,
//           duration: call.duration,
//           status: call.status
//         }
//       });

//     } catch (error) {
//       console.error('End call error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       });
//     }
//   }

//   // Get call history
//   async getCallHistory(req, res) {
//     try {
//       const userId = req.user.id;
//       const { page = 1, limit = 10 } = req.query;

//       const calls = await Call.find({
//         $or: [{ creator: userId }, { participant: userId }],
//         status: 'completed'
//       })
//       .populate('creator', 'name')
//       .populate('participant', 'name')
//       .populate('moment', 'category subCategory')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//       const total = await Call.countDocuments({
//         $or: [{ creator: userId }, { participant: userId }],
//         status: 'completed'
//       });

//       res.json({
//         success: true,
//         calls,
//         totalPages: Math.ceil(total / limit),
//         currentPage: page,
//         total
//       });

//     } catch (error) {
//       console.error('Get call history error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error'
//       });
//     }
//   }
// }

// module.exports = new CallController();

const Call = require("../models/Call");
const Moment = require("../models/Moment");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const socketService = require("../services/socketService");
const agoraService = require("../services/agoraService");

class CallController {
  // Initiate a call for Give Joy
  async initiateCall(req, res) {
    try {
      const { category } = req.body;
      const participantId = req.user.id;

      if (!category || !participantId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: category",
        });
      }

      // Find an available moment matching the category
      const availableMoment = await Moment.findOne({
        category,
        status: "active",
        isAvailable: true,
        expiresAt: { $gt: new Date() },
        currentCall: { $exists: false },
        creator: { $ne: participantId },
      }).populate("creator");

      if (!availableMoment) {
        return res.status(404).json({
          success: false,
          message: "No available moments found for this category",
        });
      }

      // Create call record
      const call = await Call.create({
        callId: uuidv4(),
        moment: availableMoment._id,
        creator: availableMoment.creator._id,
        participant: participantId,
        category: availableMoment.category,
        subCategory: availableMoment.subCategory,
        languages: availableMoment.languages,
        status: "initiated",
        agoraChannel: uuidv4(), // Use callId as Agora channel name
        startTime: new Date(),
      });

      // Update moment with current call
      availableMoment.currentCall = call._id;
      availableMoment.isAvailable = false;
      await availableMoment.save();

      // Update call status to connected
      call.status = "connected";
      await call.save();

      // Increment call counts
      await User.findByIdAndUpdate(availableMoment.creator._id, {
        $inc: { callCount: 1 },
      });
      await User.findByIdAndUpdate(participantId, {
        $inc: { callCount: 1 },
      });
      await Moment.findByIdAndUpdate(availableMoment._id, {
        $inc: { callCount: 1 },
      });

      // Emit real-time event to notify creator of incoming call
      socketService.emitCallInitiated(
        availableMoment.creator._id.toString(),
        {
          id: call._id,
          callId: call.callId,
          moment: availableMoment,
          agoraChannel: call.agoraChannel,
        }
      );

      // Emit call status update to both users
      socketService.emitCallStatusUpdate(
        call._id.toString(),
        "connected",
        [availableMoment.creator._id.toString(), participantId.toString()]
      );

      res.json({
        success: true,
        message: "Call initiated successfully",
        call: {
          id: call._id,
          callId: call.callId,
          moment: availableMoment,
          agoraChannel: call.agoraChannel,
        },
      });
    } catch (error) {
      console.error("Initiate call error:", error.message);
      console.error("Full error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to initiate call",
        error: error.message,
      });
    }
  }

  // End a call
  async endCall(req, res) {
    try {
      const { callId } = req.params;
      const userId = req.user.id;

      const call = await Call.findOne({
        callId,
        $or: [{ creator: userId }, { participant: userId }],
      }).populate("moment");

      if (!call) {
        return res.status(404).json({
          success: false,
          message: "Call not found",
        });
      }

      if (call.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Call already completed",
        });
      }

      // Calculate duration (max 30 seconds)
      const now = new Date();
      const duration = Math.min(Math.floor((now - call.startTime) / 1000), 30);

      call.endTime = now;
      call.duration = duration;
      call.status = "completed";
      await call.save();

      // Update moment availability
      if (call.moment) {
        call.moment.currentCall = null;
        call.moment.isAvailable = call.moment.expiresAt > new Date();
        await call.moment.save();
      }

      // Emit real-time event for call completion
      socketService.emitCallStatusUpdate(
        call._id.toString(),
        "completed",
        [call.creator.toString(), call.participant.toString()]
      );

      res.json({
        success: true,
        message: "Call ended successfully",
        call: {
          id: call._id,
          duration: call.duration,
          status: call.status,
        },
      });
    } catch (error) {
      console.error("End call error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get call history
  async getCallHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const calls = await Call.find({
        $or: [{ creator: userId }, { participant: userId }],
        status: "completed",
      })
        .populate("creator", "name")
        .populate("participant", "name")
        .populate("moment", "category subCategory")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Call.countDocuments({
        $or: [{ creator: userId }, { participant: userId }],
        status: "completed",
      });

      res.json({
        success: true,
        calls,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      console.error("Get call history error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get Agora token for video call
  async getAgoraToken(req, res) {
    try {
      const { channelName, uid } = req.query;
      const userId = req.user.id;

      if (!channelName) {
        return res.status(400).json({
          success: false,
          message: "Channel name is required",
        });
      }

      // Validate that the user is part of this call
      // channelName should be the agoraChannel from the call
      const call = await Call.findOne({
        agoraChannel: channelName,
        $or: [{ creator: userId }, { participant: userId }],
      });

      if (!call) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to this channel",
        });
      }

      // Generate token with user ID as UID (or 0 for auto-assignment)
      const uidNumber = uid ? parseInt(uid, 10) : 0;
      const tokenData = agoraService.generateRtcToken(
        channelName,
        uidNumber,
        "publisher"
      );

      res.json({
        success: true,
        ...tokenData,
      });
    } catch (error) {
      console.error("Get Agora token error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate token",
        error: error.message,
      });
    }
  }
}

module.exports = new CallController();

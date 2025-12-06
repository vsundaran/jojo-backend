// const {
//   CommunicationIdentityClient,
// } = require("@azure/communication-identity");
// const {
//   CallAutomationClient,
// } = require("@azure/communication-call-automation");

// class AzureACSService {
//   constructor() {
//     this.connectionString =
//       process.env.AZURECOMMUNICATIONSERVICECONNECTIONSTRING;
//     this.endpoint = process.env.AZURECOMMUNICATIONSERVICEENDPOINT;
//     this.identityClient = new CommunicationIdentityClient(
//       this.connectionString
//     );
//     this.callAutomationClient = new CallAutomationClient(this.connectionString);
//   }

//   // Create user identity
//   async createUserIdentity() {
//     try {
//       const user = await this.identityClient.createUser();

//       // ✅ FIX: Ensure the communicationUserId is properly extracted
//       if (!user || !user.communicationUserId) {
//         throw new Error("Failed to create user identity - invalid response");
//       }

//       return {
//         communicationUserId: user.communicationUserId,
//         _raw: user, // Keep the raw object for debugging
//       };
//     } catch (error) {
//       console.error("Error creating user identity:", error);
//       throw error;
//     }
//   }

//   // Generate token for user
//   async getToken(userId, expiresInMinutes = 60) {
//     try {
//       // ✅ FIX: Ensure userId is a string, not undefined
//       if (!userId || typeof userId !== "string") {
//         throw new Error(`Invalid userId: ${userId}`);
//       }

//       const tokenResponse = await this.identityClient.getToken(
//         { communicationUserId: userId },
//         ["voip"],
//         {
//           tokenExpiresInMinutes: expiresInMinutes,
//         }
//       );

//       return {
//         token: tokenResponse.token,
//         expiresOn: tokenResponse.expiresOn,
//       };
//     } catch (error) {
//       console.error("Error generating token:", error);
//       throw error;
//     }
//   }

//   async createCall(callerUserId, calleeUserId, momentId) {
//     try {
//       if (!callerUserId || typeof callerUserId !== "string") {
//         throw new Error(`Invalid callerUserId: ${callerUserId}`);
//       }
//       if (!calleeUserId || typeof calleeUserId !== "string") {
//         throw new Error(`Invalid calleeUserId: ${calleeUserId}`);
//       }

//       const target = {
//         communicationUserId: callerUserId,
//       };

//       const callInvite = {
//         source: {
//           communicationUserId: calleeUserId, // Explicit caller
//         },
//         targetParticipant: target,
//       };

//       // Alternative approach using the SDK's expected format
//       const callConnection = await this.callAutomationClient.createCall(
//         callInvite,
//         `${this.endpoint}/api/calls/callback/${momentId}`
//       );

//       if (!callConnection || !callConnection.callConnection?.callConnectionId) {
//         throw new Error("Failed to create call - invalid response");
//       }

//       return callConnection;
//     } catch (error) {
//       console.error("Error creating call:", error);
//       throw error;
//     }
//   }

//   // Hang up call
//   async hangUpCall(callConnectionId) {
//     try {
//       if (!callConnectionId) {
//         throw new Error("Invalid callConnectionId");
//       }
//       await this.callAutomationClient.hangUpCall(callConnectionId);
//     } catch (error) {
//       console.error("Error hanging up call:", error);
//       throw error;
//     }
//   }

//   // Start recording
//   async startRecording(callConnectionId, momentId) {
//     try {
//       if (!callConnectionId) {
//         throw new Error("Invalid callConnectionId");
//       }

//       const recording = await this.callAutomationClient.startRecording(
//         callConnectionId,
//         {
//           recordingContent: "audioVideo",
//           recordingFormat: "mp4",
//           recordingChannel: "mixed",
//         }
//       );
//       return recording;
//     } catch (error) {
//       console.error("Error starting recording:", error);
//       throw error;
//     }
//   }

//   // Stop recording
//   async stopRecording(recordingId) {
//     try {
//       if (!recordingId) {
//         throw new Error("Invalid recordingId");
//       }
//       await this.callAutomationClient.stopRecording(recordingId);
//     } catch (error) {
//       console.error("Error stopping recording:", error);
//       throw error;
//     }
//   }
// }

// module.exports = new AzureACSService();

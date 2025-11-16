// services/azureACSService.js
const { CommunicationIdentityClient } = require('@azure/communication-identity');
const { CallAutomationClient } = require('@azure/communication-call-automation');

class AzureACSService {
  constructor() {
    this.connectionString = process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING;
    this.endpoint = process.env.AZURE_COMMUNICATION_SERVICE_ENDPOINT;
    this.identityClient = new CommunicationIdentityClient(this.connectionString);
    this.callAutomationClient = new CallAutomationClient(this.connectionString);
  }

  // Create user identity
  async createUserIdentity() {
    try {
      const user = await this.identityClient.createUser();
      return user;
    } catch (error) {
      console.error('Error creating user identity:', error);
      throw error;
    }
  }

  // Generate token for user
  async getToken(userId, expiresInMinutes = 60) {
    try {
      const token = await this.identityClient.getToken(
        { communicationUserId: userId },
        ['voip']
      );
      return token;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  // Create a call between two users
  async createCall(callerUserId, calleeUserId, momentId) {
    try {
      const callConnectionProperties = await this.callAutomationClient.createCall(
        callerUserId,
        [calleeUserId],
        `${this.endpoint}/api/calls/callback/${momentId}`
      );

      return callConnectionProperties;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  // Hang up call
  async hangUpCall(callConnectionId) {
    try {
      await this.callAutomationClient.hangUpCall(callConnectionId);
    } catch (error) {
      console.error('Error hanging up call:', error);
      throw error;
    }
  }

  // Start recording (only if call is reported)
  async startRecording(callConnectionId, momentId) {
    try {
      const recording = await this.callAutomationClient.startRecording(
        callConnectionId,
        {
          recordingContent: 'audioVideo',
          recordingFormat: 'mp4',
          recordingChannel: 'mixed'
        }
      );
      return recording;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Stop recording
  async stopRecording(recordingId) {
    try {
      await this.callAutomationClient.stopRecording(recordingId);
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }
}

module.exports = new AzureACSService();
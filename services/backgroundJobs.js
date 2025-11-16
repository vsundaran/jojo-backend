// services/backgroundJobs.js
const cron = require('node-cron');
const Moment = require('../models/Moment');

class BackgroundJobs {
  constructor() {
    this.init();
  }

  init() {
    // Run every minute to check for expired moments
    cron.schedule('* * * * *', this.checkExpiredMoments.bind(this));
  }

  async checkExpiredMoments() {
    try {
      const now = new Date();
      
      const result = await Moment.updateMany(
        {
          status: 'active',
          expiresAt: { $lte: now }
        },
        {
          $set: {
            status: 'expired',
            isAvailable: false
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Expired ${result.modifiedCount} moments`);
      }
    } catch (error) {
      console.error('Error checking expired moments:', error);
    }
  }
}

module.exports = new BackgroundJobs();
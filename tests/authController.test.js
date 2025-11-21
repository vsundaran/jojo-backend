const authController = require('../controllers/authController');
const User = require('../models/User');

// Mock the User model
jest.mock('../models/User');

describe('AuthController', () => {
    describe('getLanguages', () => {
        let req, res;

        beforeEach(() => {
            req = {
                user: { id: 'user123' }
            };
            res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
            };
        });

        it('should return user languages successfully', async () => {
            const mockUser = {
                _id: 'user123',
                languages: ['English', 'Spanish'],
            };
            User.findById.mockResolvedValue(mockUser);

            await authController.getLanguages(req, res);

            expect(User.findById).toHaveBeenCalledWith('user123');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                languages: ['English', 'Spanish'],
            });
        });

        it('should return 404 if user not found', async () => {
            User.findById.mockResolvedValue(null);

            await authController.getLanguages(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });

        it('should handle errors', async () => {
            const error = new Error('Database error');
            User.findById.mockRejectedValue(error);

            await authController.getLanguages(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal server error',
            });
        });
    });
});

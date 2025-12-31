/**
 * Unit tests for authApi
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axiosClient from './axiosClient';
import tokenManager from './tokenManager';
import { authApi } from './authApi';

// Mock dependencies
vi.mock('./axiosClient');
vi.mock('./tokenManager');

describe('authApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should call login endpoint with credentials', async () => {
            const mockResponse = {
                data: {
                    result: { accessToken: 'test-token' }
                }
            };
            axiosClient.post.mockResolvedValueOnce(mockResponse);

            const result = await authApi.login('testuser', 'password123');

            expect(axiosClient.post).toHaveBeenCalledWith(
                '/api/v1/identity/auth/login',
                { usernameOrEmail: 'testuser', password: 'password123' }
            );
            expect(result).toEqual(mockResponse);
        });

        it('should store token in tokenManager on successful login', async () => {
            const mockResponse = {
                data: {
                    result: { accessToken: 'new-access-token' }
                }
            };
            axiosClient.post.mockResolvedValueOnce(mockResponse);

            await authApi.login('testuser', 'password123');

            expect(tokenManager.setToken).toHaveBeenCalledWith('new-access-token');
        });

        it('should handle token in different response formats', async () => {
            const mockResponse = {
                data: {
                    data: { accessToken: 'alternate-token' }
                }
            };
            axiosClient.post.mockResolvedValueOnce(mockResponse);

            await authApi.login('testuser', 'password123');

            expect(tokenManager.setToken).toHaveBeenCalledWith('alternate-token');
        });

        it('should not call setToken if no token in response', async () => {
            const mockResponse = {
                data: { message: 'Login successful' }
            };
            axiosClient.post.mockResolvedValueOnce(mockResponse);

            await authApi.login('testuser', 'password123');

            expect(tokenManager.setToken).not.toHaveBeenCalled();
        });

        it('should propagate login errors', async () => {
            const mockError = new Error('Invalid credentials');
            axiosClient.post.mockRejectedValueOnce(mockError);

            await expect(authApi.login('testuser', 'wrongpass')).rejects.toThrow('Invalid credentials');
        });
    });

    describe('register', () => {
        it('should call register endpoint with payload', async () => {
            const payload = {
                username: 'newuser',
                password: 'password123',
                confirmPass: 'password123',
                email: 'newuser@example.com',
                fullName: 'New User'
            };
            const mockResponse = { data: { result: { userId: 'user-123' } } };
            axiosClient.post.mockResolvedValueOnce(mockResponse);

            const result = await authApi.register(payload);

            expect(axiosClient.post).toHaveBeenCalledWith(
                '/api/v1/identity/users/register',
                payload
            );
            expect(result).toEqual(mockResponse);
        });

        it('should propagate registration errors', async () => {
            const mockError = new Error('Username already exists');
            axiosClient.post.mockRejectedValueOnce(mockError);

            await expect(authApi.register({ username: 'existing' })).rejects.toThrow('Username already exists');
        });
    });

    describe('logout', () => {
        it('should clear token and call logout endpoint', async () => {
            const mockResponse = { data: { message: 'Logged out' } };
            axiosClient.get.mockResolvedValueOnce(mockResponse);

            const result = await authApi.logout();

            expect(tokenManager.clearToken).toHaveBeenCalled();
            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/identity/auth/logout');
            expect(result).toEqual(mockResponse);
        });

        it('should clear token even if logout endpoint fails', async () => {
            const mockError = new Error('Network error');
            axiosClient.get.mockRejectedValueOnce(mockError);

            await expect(authApi.logout()).rejects.toThrow('Network error');
            expect(tokenManager.clearToken).toHaveBeenCalled();
        });
    });

    describe('introspect', () => {
        it('should call introspect endpoint', async () => {
            const mockResponse = { data: { valid: true } };
            axiosClient.get.mockResolvedValueOnce(mockResponse);

            const result = await authApi.introspect();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/identity/auth/introspect');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('refreshToken', () => {
        it('should call refresh endpoint and store new token', async () => {
            const mockResponse = {
                data: {
                    result: { accessToken: 'refreshed-token' }
                }
            };
            axiosClient.get.mockResolvedValueOnce(mockResponse);

            const result = await authApi.refreshToken();

            expect(axiosClient.get).toHaveBeenCalledWith('/api/v1/identity/auth/refresh-token');
            expect(tokenManager.setToken).toHaveBeenCalledWith('refreshed-token');
            expect(result).toEqual(mockResponse);
        });

        it('should handle token as direct string in result', async () => {
            const mockResponse = {
                data: {
                    result: 'direct-token-string'
                }
            };
            axiosClient.get.mockResolvedValueOnce(mockResponse);

            await authApi.refreshToken();

            expect(tokenManager.setToken).toHaveBeenCalledWith('direct-token-string');
        });

        it('should propagate refresh errors', async () => {
            const mockError = new Error('Refresh token expired');
            axiosClient.get.mockRejectedValueOnce(mockError);

            await expect(authApi.refreshToken()).rejects.toThrow('Refresh token expired');
        });
    });
});

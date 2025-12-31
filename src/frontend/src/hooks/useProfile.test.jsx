/**
 * Unit tests for useProfile hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from './useProfile';
import { AuthContext } from '../context/AuthContext';
import { userApi } from '../api/userApi';

// Mock userApi
vi.mock('../api/userApi', () => ({
    userApi: {
        getMyProfile: vi.fn(),
        updateProfile: vi.fn(),
        uploadAvatar: vi.fn(),
    },
}));

// Create wrapper with AuthContext provider
const createWrapper = (authValue) => {
    const Wrapper = ({ children }) => (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
    return Wrapper;
};

describe('useProfile Hook', () => {
    const mockUser = {
        id: 'user-123',
        fullName: 'Test User',
        email: 'test@example.com',
        avatar: 'https://example.com/avatar.jpg',
    };

    const mockAuthValue = {
        user: mockUser,
        isAuthenticated: true,
        loading: false,
        error: '',
        login: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with null profile', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(result.current.profile).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
    });

    it('should return currentUser from AuthContext', () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should fetch profile successfully', async () => {
        const mockProfileData = {
            userId: 'user-123',
            fullName: 'Test User Profile',
            email: 'test@example.com',
            phone: '0123456789',
        };

        userApi.getMyProfile.mockResolvedValueOnce({
            data: { result: mockProfileData },
        });

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        await act(async () => {
            await result.current.fetchProfile();
        });

        expect(result.current.profile).toEqual(mockProfileData);
        expect(result.current.loading).toBe(false);
        expect(userApi.getMyProfile).toHaveBeenCalledTimes(1);
    });


    it('should update profile successfully', async () => {
        const updatePayload = { fullName: 'Updated Name' };
        const updatedProfile = {
            userId: 'user-123',
            fullName: 'Updated Name',
            email: 'test@example.com',
        };

        userApi.updateProfile.mockResolvedValueOnce({
            data: { result: updatedProfile },
        });

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        await act(async () => {
            await result.current.updateProfile(updatePayload);
        });

        expect(result.current.profile).toEqual(updatedProfile);
        expect(userApi.updateProfile).toHaveBeenCalledWith(updatePayload);
    });

    it('should upload avatar successfully', async () => {
        const mockFile = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });
        const mockAvatarUrl = 'https://example.com/new-avatar.jpg';

        userApi.uploadAvatar.mockResolvedValueOnce({
            data: { result: { avatarUrl: mockAvatarUrl } },
        });
        mockAuthValue.refreshUser.mockResolvedValueOnce({});

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        await act(async () => {
            await result.current.uploadAvatar(mockFile);
        });

        expect(userApi.uploadAvatar).toHaveBeenCalledWith(mockFile);
        expect(mockAuthValue.refreshUser).toHaveBeenCalled();
    });

    it('should return null when uploading without file', async () => {
        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        let uploadResult;
        await act(async () => {
            uploadResult = await result.current.uploadAvatar(null);
        });

        expect(uploadResult).toBeNull();
        expect(userApi.uploadAvatar).not.toHaveBeenCalled();
    });

    it('should provide memoized functions', () => {
        const { result, rerender } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        const firstFetchProfile = result.current.fetchProfile;
        const firstUpdateProfile = result.current.updateProfile;

        rerender();

        expect(result.current.fetchProfile).toBe(firstFetchProfile);
        expect(result.current.updateProfile).toBe(firstUpdateProfile);
    });

    it('should set loading state during fetch', async () => {
        // Create a delayed promise to check loading state
        let resolvePromise;
        const delayedPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });

        userApi.getMyProfile.mockReturnValueOnce(delayedPromise);

        const { result } = renderHook(() => useProfile(), {
            wrapper: createWrapper(mockAuthValue),
        });

        // Start fetch but don't await
        let fetchPromise;
        act(() => {
            fetchPromise = result.current.fetchProfile();
        });

        // Loading should be true during fetch
        expect(result.current.loading).toBe(true);

        // Resolve the promise
        await act(async () => {
            resolvePromise({ data: { result: { userId: 'user-123' } } });
            await fetchPromise;
        });

        expect(result.current.loading).toBe(false);
    });
});

/**
 * Unit tests for useAuth hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthContext } from '../context/AuthContext';

// Create wrapper with AuthContext provider
const createWrapper = (value) => {
    const Wrapper = ({ children }) => (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
    return Wrapper;
};

describe('useAuth Hook', () => {
    const mockAuthValue = {
        user: { id: 'user-123', fullName: 'Test User', email: 'test@example.com' },
        isAuthenticated: true,
        loading: false,
        error: '',
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
        setUser: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return auth context values', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(result.current.user).toEqual(mockAuthValue.user);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('');
    });

    it('should provide login function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(typeof result.current.login).toBe('function');
    });

    it('should provide logout function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(typeof result.current.logout).toBe('function');
    });

    it('should provide register function', () => {
        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(mockAuthValue),
        });

        expect(typeof result.current.register).toBe('function');
    });

    it('should throw error when used outside AuthProvider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within an AuthProvider');

        consoleSpy.mockRestore();
    });

    it('should return user as null when not authenticated', () => {
        const unauthenticatedValue = {
            ...mockAuthValue,
            user: null,
            isAuthenticated: false,
        };

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(unauthenticatedValue),
        });

        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return loading state correctly', () => {
        const loadingValue = {
            ...mockAuthValue,
            loading: true,
        };

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(loadingValue),
        });

        expect(result.current.loading).toBe(true);
    });

    it('should return error message when present', () => {
        const errorValue = {
            ...mockAuthValue,
            error: 'Login failed',
        };

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(errorValue),
        });

        expect(result.current.error).toBe('Login failed');
    });
});

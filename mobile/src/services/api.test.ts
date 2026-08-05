import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api, { loginApi, requestAccessApi } from './api';

// This sets the mock adapter on the custom instance
const mock = new MockAdapter(api);

describe('API Auth Services', () => {
    afterEach(() => {
        mock.reset();
    });

    describe('loginApi', () => {
        it('should send a POST request to /auth/login with the provided credentials', async () => {
            const data = { username: 'testuser', password: 'password123' };
            const expectedResponse = { token: 'fake-token' };

            mock.onPost('/auth/login', data).reply(200, expectedResponse);

            const response = await loginApi(data);

            expect(response.status).toBe(200);
            expect(response.data).toEqual(expectedResponse);
            // Verify the request details
            expect(mock.history.post.length).toBe(1);
            expect(mock.history.post[0].url).toBe('/auth/login');
            expect(JSON.parse(mock.history.post[0].data)).toEqual(data);
        });

        it('should handle errors appropriately when login fails', async () => {
            const data = { username: 'testuser', password: 'wrongpassword' };

            mock.onPost('/auth/login', data).reply(401, { detail: 'Unauthorized' });

            try {
                await loginApi(data);
                // If it doesn't throw, the test should fail
                expect(true).toBe(false);
            } catch (error: any) {
                expect(error.response.status).toBe(401);
                expect(error.response.data.detail).toBe('Unauthorized');
            }
        });
    });

    describe('requestAccessApi', () => {
        it('should send a POST request to /auth/request-access with the provided data', async () => {
            const data = { role: 'admin', email: 'test@example.com' };
            const expectedResponse = { message: 'Request submitted successfully' };

            mock.onPost('/auth/request-access', data).reply(200, expectedResponse);

            const response = await requestAccessApi(data);

            expect(response.status).toBe(200);
            expect(response.data).toEqual(expectedResponse);

            expect(mock.history.post.length).toBe(1);
            expect(mock.history.post[0].url).toBe('/auth/request-access');
            expect(JSON.parse(mock.history.post[0].data)).toEqual(data);
        });
    });
});

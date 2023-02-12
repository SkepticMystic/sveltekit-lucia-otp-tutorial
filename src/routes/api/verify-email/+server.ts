import { auth } from '$lib/server/lucia';
import { validateOTP } from '$lib/models/OTPs';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
    const token = url.searchParams.get('token');

    // Validate the token
    if (typeof token !== 'string') throw error(400, 'Invalid token');

    const check = await validateOTP(token, 'email-verification');
    if (!check.ok) throw error(400, 'Invalid token');

    const { user, otp } = check;

    await auth.updateUserAttributes(user.userId, {
        emailVerified: true
    });

    await otp.remove();

    throw redirect(302, '/');
};
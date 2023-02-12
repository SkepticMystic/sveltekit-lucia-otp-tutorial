import { auth } from '$lib/server/lucia';
import { getExistingOrNewOTP } from '$lib/models/OTPs';
import { type Actions, error } from '@sveltejs/kit';

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await request.formData();
        const email = form.get('email');
        if (typeof email !== 'string') throw error(400, 'Invalid email');

        const { user } = await auth.getKeyUser('email', email);
        if (!user) {
            // Don't reveal whether the email exists or not
            return { ok: true };
        }

        const { userId } = user;
        const OTP = await getExistingOrNewOTP({
            userId,
            kind: 'password-reset',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
        });

        const href = `${url.origin}/reset-password?token=${OTP.token}`;
        console.log(href);
        console.log('TODO: sendEmail');

        return { ok: true };
    }
};
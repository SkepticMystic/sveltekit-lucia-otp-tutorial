import { auth } from '$lib/server/lucia';
import { validateOTP } from '$lib/models/OTPs';
import { error, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await request.formData();
        const newPass = form.get('newPass');
        const token = url.searchParams.get('token');

        // Validate the form data and token
        if (typeof newPass !== 'string') throw error(400, 'Invalid form data');
        if (typeof token !== 'string') throw error(400, 'Invalid token');

        const check = await validateOTP(token, 'password-reset');
        if (!check.ok) throw error(400, 'Invalid token');

        const { user, otp } = check;
        try {
            await auth.updateKeyPassword('email', user.email, newPass);
            // Remove the OTP so it can't be used again
            await otp.remove();

            return { ok: true };
        } catch (err) {
            console.log(err);
            throw error(500, 'Something went wrong');
        }
    }
};
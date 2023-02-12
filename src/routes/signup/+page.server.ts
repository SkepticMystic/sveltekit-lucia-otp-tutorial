import { OTPs } from '$lib/models/OTPs';
import { auth } from '$lib/server/lucia';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// On page load, redirect authenticated users to the home page
export const load: PageServerLoad = async ({ locals }) => {
    const session = await locals.validate();
    if (session) throw redirect(302, '/');
    return {};
};

export const actions: Actions = {
    default: async ({ request, locals, url }) => {
        const form = await request.formData();
        const email = form.get('email');
        const password = form.get('password');

        // Validate form data
        if (typeof email !== 'string' || typeof password !== 'string') {
            throw error(400, 'Invalid email or password');
        }

        try {
            const { userId } = await auth.createUser({
                key: {
                    // The authentication provider we're using
                    providerId: 'email',
                    // The user's email
                    providerUserId: email,
                    password
                },
                attributes: {
                    email,
                    emailVerified: false
                }
            });


            // If successful, we know there no existing email-verification OTPs,
            //   since we just created the user.
            //   So we can create a new one without checking for existing ones.
            const otp = await OTPs.create({
                userId,
                kind: 'email-verification',
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
            });
            const href = `${url.origin}/api/verify-email?token=${otp.token}`;
            console.log(href);
            console.log('TODO: sendEmail');


            // Create and set the session cookies
            const session = await auth.createSession(userId);
            locals.setSession(session);
        } catch {
            // Email already taken
            throw error(409, 'Email already taken');
        }
    }
};

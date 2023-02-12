// This comes from the Lucia startup guide
import { auth } from '$lib/server/lucia';
import mongoose from 'mongoose';

// Every OTP has the following properties
export interface OTPBase {
    // The user that the OTP is for
    userId: string;
    // The token that the user will use to verify the OTP
    token: string;
    // An optional expiry date for the OTP
    expiresAt?: Date;
}

// OTPs can be of different kinds
// We use this to prevent one token from being used for multiple purposes
export interface EmailVerificationOTP extends OTPBase {
    kind: 'email-verification';
}

export interface PasswordResetOTP extends OTPBase {
    kind: 'password-reset';
}

export type OTP = EmailVerificationOTP | PasswordResetOTP;

const modelName = 'OTPs';
export const OTPs =
    mongoose.models[modelName] ||
    mongoose.model<OTP>(
        modelName,
        new mongoose.Schema(
            {
                userId: {
                    type: String,
                    required: true,
                    ref: 'user'
                },
                token: {
                    type: String,
                    required: true,
                    // Use the crypto Web API to generate a random token
                    default: () => crypto.randomUUID()
                },
                expiresAt: {
                    type: Date
                },
                kind: {
                    type: String,
                    required: true,
                    enum: ['email-verification', 'password-reset']
                }
            },
            { timestamps: true }
        ),
        modelName
    );

// Check if an OTP is expired
// If it doesn't have an expiry date, it's never expired
export const isOPTExpired = <T extends { expiresAt?: Date }>(otp: T) => {
    if (otp.expiresAt === undefined) return false;
    else return otp.expiresAt.getTime() < Date.now();
};

/**
 * Return an existing OTP if it exists and is not expired,
 *   or create a new one if it doesn't exist or is expired.
 */
export const getExistingOrNewOTP = async (options: {
    userId: string;
    kind: OTP['kind'];
    expiresAt?: Date;
}) => {
    const { userId, kind, expiresAt } = options;

    // Check if there is an existing OTP for that user of that kind
    const existing = await OTPs.findOne({ userId, kind }).exec();

    if (existing) {
        if (isOPTExpired(existing)) {
            console.log('Existing OTP expired, creating new one');
            const [newOTP, _removeOld] = await Promise.all([
                OTPs.create({ userId, kind, expiresAt }),
                existing.remove()
            ]);

            return newOTP;
        } else {
            console.log('Existing OTP not expired, returning it');
            return existing;
        }
    } else {
        console.log('No existing OTP, creating new one');
        return OTPs.create({ userId, kind, expiresAt });
    }
};

/**
 * Given a token, and the kind of OTP, returns the user and the OTP if it exists and is not expired.
 *
 * If the OTP is expired, it will be deleted if `deleteIfExpired` is true.
 *
 * If the user is not found, the OTP will be deleted.
 */
export const validateOTP = async (token: string, kind: OTP['kind']) => {
    const otp = await OTPs.findOne({ token, kind }).exec();
    if (!otp) {
        console.log('OTP not found');
        return { ok: <const>false };
    }

    if (isOPTExpired(otp)) {
        console.log('OTP expired');
        await otp.remove();
        return { ok: <const>false };
    }

    const user = await auth.getUser(otp.userId);
    if (!user) {
        console.log('User not found');
        await otp.remove();
        return { ok: <const>false };
    }

    return { ok: <const>true, user, otp };
};
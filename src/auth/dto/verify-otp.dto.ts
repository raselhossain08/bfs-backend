import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail({}, { message: 'Please provide a valid email address.' })
    email: string;

    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits.' })
    otp: string;
}
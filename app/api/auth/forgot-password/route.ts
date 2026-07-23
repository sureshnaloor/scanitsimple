import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAppBaseUrl } from '@/lib/ensureAuthEnv';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!email.endsWith('@jalint.com.sa')) {
      return NextResponse.json(
        { error: 'Only @jalint.com.sa email addresses are allowed' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if user exists
    const user = await db.collection('authusers').findOne({ email });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive password reset instructions.'
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await db.collection('authusers').updateOne(
      { email },
      { 
        $set: { 
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date()
        } 
      }
    );

    // Create email transporter (you'll need to configure this with your email service)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Create reset URL
    const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@jalint.com.sa',
      to: email,
      subject: 'Password Reset Request - Asset Tags',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your Asset Tags account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>Asset Tags Team</p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
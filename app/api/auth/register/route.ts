import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hash } from 'bcrypt';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email.endsWith('@jalint.com.sa')) {
      return NextResponse.json(
        { error: 'Only @jalint.com.sa email addresses are allowed' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    const existingUser = await db.collection('authusers').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    await db.collection('authusers').insertOne({
      email,
      password: hashedPassword,
      isApproved: false,
      role: 'user',
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful. Please wait for admin approval.' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
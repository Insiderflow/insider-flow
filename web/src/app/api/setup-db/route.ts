import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    // This endpoint is for initial database setup
    // Run this once after deployment to set up the database
    
    // You can add any initial data setup here
    // For now, just return success
    
    return NextResponse.json({ 
      message: 'Database setup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Database setup failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

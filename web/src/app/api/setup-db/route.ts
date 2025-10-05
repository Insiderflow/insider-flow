import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // First, try to run migrations
    console.log('Running Prisma migrations...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Prisma migrations completed successfully');
    } catch {
      console.log('Migration failed, trying to push schema directly...');
      // If migrations fail, try to push the schema directly
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('Schema pushed successfully');
    }
    
    // Test the database connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    return NextResponse.json({ 
      message: 'Database setup completed - tables created',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Database setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

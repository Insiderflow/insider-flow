import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    console.log('Checkout request received');
    const user = await getSessionUser();
    if (!user) {
      console.error('No user found');
      return NextResponse.json({ error: 'login required' }, { status: 401 });
    }


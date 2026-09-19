import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import {
  getAllMemoryRules,
  addMemoryRule,
  deleteMemoryRule,
  summarizeAndLearnCorrection,
  getAgentMemoryContext,
  isAiAdminUser,
} from '@/lib/ai/agent-memory';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const isAiAdmin = isAiAdminUser(session.user.email);
    const rules = await getAllMemoryRules();
    const markdownContext = await getAgentMemoryContext();

    return NextResponse.json({
      success: true,
      data: {
        rules,
        markdownContext,
        isAiAdmin,
      },
    });
  } catch (error: any) {
    console.error('Error fetching agent memory:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch memory rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (!isAiAdminUser(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden. Only registered AI admin users can modify agent memory.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, userPrompt, userCorrection, queryPlan, topic, rule } = body;

    // Action 1: User submitted feedback on a query result (auto-summarized into a memory rule)
    if (action === 'learn_feedback') {
      if (!userCorrection || !userCorrection.trim()) {
        return NextResponse.json({ error: 'Feedback / correction text is required.' }, { status: 400 });
      }

      const learned = await summarizeAndLearnCorrection({
        userPrompt: userPrompt || '',
        userCorrection: userCorrection.trim(),
        queryPlan: queryPlan || null,
        userEmail: session.user.email,
      });

      return NextResponse.json({
        success: true,
        data: learned,
        message: `Learned new rule for [${learned.topic}]: "${learned.rule}"`,
      });
    }

    // Action 2: Manual rule creation
    if (!rule || !rule.trim()) {
      return NextResponse.json({ error: 'Rule text is required.' }, { status: 400 });
    }

    const ruleId = await addMemoryRule({
      topic: topic?.trim() || 'Custom Rule',
      rule: rule.trim(),
      promptContext: userPrompt?.trim() || '',
      createdBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      data: { id: ruleId },
      message: 'Memory rule added successfully.',
    });
  } catch (error: any) {
    console.error('Error saving agent memory:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save memory rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (!isAiAdminUser(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden. Only registered AI admin users can delete agent memory rules.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing rule ID.' }, { status: 400 });
    }

    const deleted = await deleteMemoryRule(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Rule not found or already deleted.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Memory rule deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting agent memory:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete memory rule' },
      { status: 500 }
    );
  }
}

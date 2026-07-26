import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { apiJson } from '@/lib/api-response';

export async function GET(
  request: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const tool = await db
      .collection('tools')
      .findOne({ assetnumber: params.toolId });

    if (!tool) {
      return apiJson(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    return apiJson(tool);
  } catch (error) {
    console.error('Failed to fetch tool:', error);
    return apiJson(
      { error: 'Failed to fetch tool' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;
    const updateData = await request.json();

    console.log('Processing update for tool:', toolId);

    const { db } = await connectToDatabase();

    // First check if the tool exists
    const existingTool = await db.collection('tools').findOne({ assetnumber: toolId });

    if (!existingTool) {
      console.error('Tool not found in database:', toolId);
      return apiJson(
        { error: `Tool ${toolId} not found` },
        { status: 404 }
      );
    }

    // Remove immutable and protected fields
    const {
      _id,
      assetnumber: _an,
      createdAt,
      ...updateFields
    } = updateData;

    // Add updated timestamp
    updateFields.updatedAt = new Date();

    console.log('Updating tool with fields:', updateFields);

    const updatedTool = await db.collection('tools').findOneAndUpdate(
      { assetnumber: toolId.toString() },
      { $set: updateFields },
      { 
        returnDocument: 'after'
      }
    );

    if (!updatedTool) {
      console.error('Update failed for tool:', toolId);
      return apiJson(
        { error: 'Failed to update tool' },
        { status: 500 }
      );
    }

    console.log('Tool updated successfully:', updatedTool);
    return apiJson(updatedTool);

  } catch (error) {
    console.error('Error in tool update:', error);
    return apiJson(
      { 
        error: 'Failed to update tool',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;
    const { db } = await connectToDatabase();

    // Check if tool exists
    const existingTool = await db.collection('tools').findOne({ assetnumber: toolId });
    if (!existingTool) {
      return apiJson(
        { error: `Tool ${toolId} not found` },
        { status: 404 }
      );
    }

    // Delete the tool
    const result = await db.collection('tools').deleteOne({ assetnumber: toolId });

    if (result.deletedCount === 0) {
      return apiJson(
        { error: 'Failed to delete tool' },
        { status: 500 }
      );
    }

    return apiJson({ message: 'Tool deleted successfully' });

  } catch (error) {
    console.error('Error deleting tool:', error);
    return apiJson(
      { 
        error: 'Failed to delete tool',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

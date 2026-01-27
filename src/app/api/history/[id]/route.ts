// ============================================================================
// URL Lens - History Item API Route
// DELETE /api/history/[id]
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DeleteResponse } from '@/types';

/**
 * DELETE /api/history/[id]
 * Deletes a specific URL analysis record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteResponse>> {
  try {
    // 1. Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Get the ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID format' },
        { status: 400 }
      );
    }

    // 3. First verify the record belongs to the user
    const { data: existingRecord, error: fetchError } = await supabase
      .from('url_analyses')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this record' },
        { status: 403 }
      );
    }

    // 4. Delete the record
    const { error: deleteError } = await supabase
      .from('url_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' },
        { status: 500 }
      );
    }

    // 5. Return success response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

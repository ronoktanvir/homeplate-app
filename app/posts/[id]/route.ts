import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json()
  if (!['like', 'unlike', 'save', 'unsave'].includes(action)) {
    return NextResponse.json({ error: 'Invalid post action' }, { status: 400 })
  }

  if (action === 'like') {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: id })

    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (action === 'unlike') {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: user.id, post_id: id })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'save') {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ user_id: user.id, post_id: id })

    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else if (action === 'unsave') {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .match({ user_id: user.id, post_id: id })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

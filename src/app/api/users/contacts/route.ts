import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Contact type for responses
interface ContactWithProfile {
  id: string;
  owner_id: string;
  phone: string;
  name: string | null;
  is_blocked: boolean;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    status: string | null;
    last_seen: string | null;
  } | null;
}

// GET - List user's contacts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const includeBlocked = searchParams.get('blocked') === 'true';
    const blockedOnly = searchParams.get('blocked_only') === 'true';

    // Get contacts with profile information
    const { data: contacts, error } = await adminClient
      .from('contacts')
      .select(`
        id,
        owner_id,
        phone,
        name,
        is_blocked,
        created_at
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get contacts error:', error);
      return NextResponse.json(
        { error: 'Failed to get contacts' },
        { status: 500 }
      );
    }

    // Filter contacts based on params
    let filteredContacts = contacts || [];
    if (blockedOnly) {
      filteredContacts = filteredContacts.filter(c => c.is_blocked);
    } else if (!includeBlocked) {
      filteredContacts = filteredContacts.filter(c => !c.is_blocked);
    }

    // Get profile info for each contact's phone number
    const phoneNumbers = filteredContacts.map(c => c.phone).filter(Boolean);

    let profilesByPhone: Record<string, ContactWithProfile['profile']> = {};

    if (phoneNumbers.length > 0) {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, display_name, avatar_url, phone, status, last_seen')
        .in('phone', phoneNumbers);

      if (profiles) {
        profilesByPhone = profiles.reduce((acc, profile) => {
          if (profile.phone) {
            acc[profile.phone] = {
              id: profile.id,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              status: profile.status,
              last_seen: profile.last_seen,
            };
          }
          return acc;
        }, {} as Record<string, ContactWithProfile['profile']>);
      }
    }

    // Combine contacts with profile data
    const contactsWithProfiles: ContactWithProfile[] = filteredContacts.map(contact => ({
      ...contact,
      profile: profilesByPhone[contact.phone] || null,
    }));

    return NextResponse.json({
      contacts: contactsWithProfiles,
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to get contacts' },
      { status: 500 }
    );
  }
}

// POST - Add a new contact or sync contacts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Check if this is a bulk sync request
    if (Array.isArray(body.contacts)) {
      return await syncContacts(user.id, body.contacts, adminClient);
    }

    // Single contact add
    const { phone, name } = body;

    // Validate phone
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const { data: existingContact } = await adminClient
      .from('contacts')
      .select('id, is_blocked')
      .eq('owner_id', user.id)
      .eq('phone', phone)
      .single();

    if (existingContact) {
      // If blocked, unblock it
      if (existingContact.is_blocked) {
        const { data: updatedContact, error } = await adminClient
          .from('contacts')
          .update({ is_blocked: false, name: name || null })
          .eq('id', existingContact.id)
          .select()
          .single();

        if (error) {
          console.error('Unblock contact error:', error);
          return NextResponse.json(
            { error: 'Failed to unblock contact' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          contact: updatedContact,
          message: 'Contact unblocked successfully',
        });
      }

      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 400 }
      );
    }

    // Add new contact
    const { data: newContact, error } = await adminClient
      .from('contacts')
      .insert({
        owner_id: user.id,
        phone,
        name: name || null,
        is_blocked: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Add contact error:', error);
      return NextResponse.json(
        { error: 'Failed to add contact' },
        { status: 500 }
      );
    }

    // Try to get profile info for this phone number
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, display_name, avatar_url, phone, status, last_seen')
      .eq('phone', phone)
      .single();

    return NextResponse.json({
      success: true,
      contact: {
        ...newContact,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json(
      { error: 'Failed to add contact' },
      { status: 500 }
    );
  }
}

// Sync contacts in bulk
async function syncContacts(
  userId: string,
  contacts: Array<{ phone: string; name?: string }>,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const results = {
    added: 0,
    updated: 0,
    total: contacts.length,
    contacts: [] as ContactWithProfile[],
  };

  for (const contact of contacts) {
    if (!contact.phone) continue;

    // Check if contact exists
    const { data: existingContact } = await adminClient
      .from('contacts')
      .select('id, is_blocked')
      .eq('owner_id', userId)
      .eq('phone', contact.phone)
      .single();

    if (existingContact) {
      // Update name if provided and not blocked
      if (contact.name && !existingContact.is_blocked) {
        await adminClient
          .from('contacts')
          .update({ name: contact.name })
          .eq('id', existingContact.id);
        results.updated++;
      }
    } else {
      // Add new contact
      const { data: newContact, error } = await adminClient
        .from('contacts')
        .insert({
          owner_id: userId,
          phone: contact.phone,
          name: contact.name || null,
          is_blocked: false,
        })
        .select()
        .single();

      if (!error && newContact) {
        results.added++;

        // Get profile info
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id, display_name, avatar_url, phone, status, last_seen')
          .eq('phone', contact.phone)
          .single();

        results.contacts.push({
          ...newContact,
          profile: profile || null,
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}

// DELETE - Remove/block a contact
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');
    const phone = searchParams.get('phone');
    const block = searchParams.get('block') === 'true';

    // Need either contact ID or phone number
    if (!contactId && !phone) {
      return NextResponse.json(
        { error: 'Contact ID or phone number is required' },
        { status: 400 }
      );
    }

    // Find the contact
    let query = adminClient
      .from('contacts')
      .select('id')
      .eq('owner_id', user.id);

    if (contactId) {
      query = query.eq('id', contactId);
    } else if (phone) {
      query = query.eq('phone', phone);
    }

    const { data: contact, error: findError } = await query.single();

    if (findError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    if (block) {
      // Block the contact instead of deleting
      const { error: blockError } = await adminClient
        .from('contacts')
        .update({ is_blocked: true })
        .eq('id', contact.id);

      if (blockError) {
        console.error('Block contact error:', blockError);
        return NextResponse.json(
          { error: 'Failed to block contact' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Contact blocked successfully',
      });
    }

    // Delete the contact
    const { error: deleteError } = await adminClient
      .from('contacts')
      .delete()
      .eq('id', contact.id);

    if (deleteError) {
      console.error('Delete contact error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete contact' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}

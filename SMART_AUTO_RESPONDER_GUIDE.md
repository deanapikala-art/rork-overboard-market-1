# Smart Auto-Responder System - Implementation Guide

## Overview

The Smart Auto-Responder System allows vendors on Overboard Market to automatically reply to customer messages when they're unavailable. The system supports three modes: **After Hours**, **Vacation**, and **Always On**.

## 🎯 Features

### 1. **Three Operation Modes**
   - **After Hours**: Automatically replies outside configured business hours
   - **Vacation**: Replies during specified vacation dates with return date
   - **Always On**: Replies to all incoming messages

### 2. **Smart Cooldown System**
   - Prevents spam by limiting replies to the same customer
   - Configurable cooldown period (default: 12 hours)
   - Tracks last-sent timestamps per recipient

### 3. **Message Customization**
   - Custom message templates for each mode
   - Merge tags support (e.g., `{{returnDate}}`)
   - Character counter for message length

### 4. **Business Hours Configuration**
   - Set shop open/close times
   - Timezone support
   - Only triggers outside business hours in After Hours mode

### 5. **Automatic Triggering**
   - Responds to new customer messages
   - Can respond to new order notifications
   - Database-level triggers for reliability

## 📋 Database Schema

The system uses two main tables:

### `vendor_auto_responder`
Stores vendor auto-reply settings:
- `vendor_id`: Vendor identifier (unique)
- `is_enabled`: Master on/off toggle
- `mode`: Operating mode (AfterHours | Vacation | AlwaysOn)
- `start_date` / `end_date`: Vacation date range
- `business_hours`: JSON object with open/close times
- `message_template`: The auto-reply message
- `trigger_types`: Array of trigger events
- `cooldown_hours`: Minimum hours between replies
- `last_triggered_at`: Last auto-reply timestamp

### `auto_responder_log`
Tracks all sent auto-replies for analytics:
- `vendor_id`: Vendor who sent the auto-reply
- `recipient_id`: Customer who received it
- `conversation_id`: Related conversation
- `trigger_type`: What triggered it (newMessage | newOrder)
- `message_sent`: The actual message text
- `sent_at`: Timestamp

## 🔧 Setup Instructions

### Step 1: Run Database Migration

Execute the SQL schema in Supabase:

\`\`\`bash
# In Supabase SQL Editor, run:
app/utils/autoResponderSchema.sql
\`\`\`

This creates:
- Tables with proper indexes
- Database functions for checking conditions
- Automatic triggers
- Row-level security policies

### Step 2: Verify Installation

The auto-responder context is already added to the app providers in `app/_layout.tsx`.

### Step 3: Access Vendor Settings

Vendors can configure their auto-responder by navigating to:

\`\`\`
/vendor/auto-responder-settings
\`\`\`

## 🚀 Usage

### For Vendors

1. **Navigate to Settings**
   - Open the vendor dashboard
   - Go to "Auto-Responder Settings"

2. **Enable Auto-Responder**
   - Toggle the master switch on

3. **Choose a Mode**
   - **After Hours**: Set your business hours (e.g., 9 AM - 5 PM)
   - **Vacation**: Set start and end dates
   - **Always On**: Replies to all messages

4. **Customize Message**
   - Write your auto-reply message
   - Use `{{returnDate}}` in Vacation mode to show return date
   - Keep it friendly and informative

5. **Set Cooldown**
   - Default is 12 hours
   - Prevents sending multiple replies to same customer

6. **Test It**
   - Click "Test Auto-Responder" to see if it would trigger
   - Shows why it would or wouldn't send

7. **Save**
   - Click Save to activate your settings

### For Developers

#### Using the Context

\`\`\`typescript
import { useAutoResponder } from '@/app/contexts/AutoResponderContext';

function MyComponent() {
  const {
    settings,
    loadSettings,
    updateSettings,
    toggleEnabled,
    testAutoReply
  } = useAutoResponder();

  // Load vendor settings
  useEffect(() => {
    loadSettings(vendorID);
  }, [vendorID]);

  // Update settings
  const handleUpdate = async () => {
    const result = await updateSettings(vendorID, {
      isEnabled: true,
      mode: 'Vacation',
      messageTemplate: 'I\\'m away until {{returnDate}}'
    });
  };

  // Test if auto-reply would send
  const handleTest = async () => {
    const result = await testAutoReply(vendorID);
    console.log(result.shouldSend, result.reason);
  };
}
\`\`\`

#### Checking Auto-Reply Status

The system automatically checks and sends auto-replies via database triggers. No client-side code needed for triggering.

To manually check if an auto-reply would send:

\`\`\`sql
SELECT should_send_auto_reply(
  'vendor_id_here',
  'customer_id_here',
  'newMessage'
);
\`\`\`

## 🎨 UI Components

### Auto-Responder Settings Screen

Location: `app/vendor/auto-responder-settings.tsx`

Features:
- Master enable/disable toggle
- Mode selection (visual cards)
- Business hours time pickers
- Vacation date inputs
- Message template editor with character count
- Cooldown configuration
- Test button
- Save with validation

### Message Thread Display

Auto-replies appear in the chat thread with:
- System message styling (gray italic text)
- "Auto-Reply" label
- Distinct visual appearance from regular messages

## 🔒 Security & Privacy

### Row-Level Security (RLS)
- Vendors can only view/edit their own auto-responder settings
- Admins can view all settings for moderation
- Auto-responder logs are vendor-specific

### Access Control
- Only authenticated vendors can create/update settings
- Settings tied to vendor's auth user ID
- No cross-vendor access

## 📊 Analytics & Monitoring

### Auto-Responder Log

Track auto-reply performance:

\`\`\`sql
-- Get auto-replies sent in last 7 days
SELECT COUNT(*), trigger_type
FROM auto_responder_log
WHERE vendor_id = 'vendor_id_here'
  AND sent_at >= NOW() - INTERVAL '7 days'
GROUP BY trigger_type;

-- Find most active auto-responders
SELECT vendor_id, COUNT(*) as reply_count
FROM auto_responder_log
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY vendor_id
ORDER BY reply_count DESC
LIMIT 10;
\`\`\`

## 🧪 Testing

### Manual Testing

1. **Test After Hours Mode**
   - Set business hours to 9 AM - 5 PM
   - Send test message at 8 PM
   - Should receive auto-reply

2. **Test Vacation Mode**
   - Set start date to today
   - Set end date to next week
   - Send test message
   - Should receive auto-reply with return date

3. **Test Cooldown**
   - Send first message → get auto-reply
   - Send second message within cooldown period
   - Should NOT receive another auto-reply

4. **Test Always On**
   - Enable Always On mode
   - Send message any time
   - Should always receive auto-reply

### Using Test Function

\`\`\`typescript
const result = await testAutoReply(vendorID);
console.log(result.shouldSend); // true or false
console.log(result.reason); // explanation
\`\`\`

## 🐛 Troubleshooting

### Auto-Reply Not Sending

1. **Check if enabled**
   - Verify `is_enabled = true` in database

2. **Check mode conditions**
   - After Hours: Verify current time is outside business hours
   - Vacation: Verify current date is within range
   - Always On: Should always work

3. **Check cooldown**
   - Query `auto_responder_log` for recent replies to same customer
   - Verify cooldown period has passed

4. **Check trigger types**
   - Verify 'newMessage' is in `trigger_types` array

5. **Check database function**
   \`\`\`sql
   SELECT should_send_auto_reply(
     'vendor_id',
     'customer_id',
     'newMessage'
   );
   \`\`\`

### Message Not Appearing

1. **Check message insertion**
   - Verify message was inserted into `messages` table
   - Check `system_type = 'status'`

2. **Check conversation participants**
   - Ensure both vendor and customer are participants

3. **Check RLS policies**
   - Verify customer can read system messages

## 🔄 Migration from Existing System

If you have an existing messaging system:

1. Run the auto-responder schema
2. Existing messages continue to work
3. Auto-replies only apply to new messages
4. No data migration needed

## 📚 API Reference

### Context Methods

#### `loadSettings(vendorID: string)`
Loads auto-responder settings for a vendor.

#### `updateSettings(vendorID: string, updates: Partial<AutoResponderSettings>)`
Updates existing settings. Returns `{success: boolean, error?: string}`.

#### `createSettings(vendorID: string, settings: Partial<AutoResponderSettings>)`
Creates new auto-responder settings. Returns `{success: boolean, error?: string}`.

#### `toggleEnabled(vendorID: string, enabled: boolean)`
Quick toggle for enabling/disabling. Returns `{success: boolean, error?: string}`.

#### `testAutoReply(vendorID: string)`
Tests if auto-reply would send right now. Returns `{shouldSend: boolean, reason: string}`.

#### `loadLogs(vendorID: string, limit?: number)`
Loads recent auto-reply log entries (default 50).

### Database Functions

#### `should_send_auto_reply(vendor_id, recipient_id, trigger_type)`
Returns boolean indicating if auto-reply should send.

#### `send_auto_reply(vendor_id, recipient_id, conversation_id, trigger_type)`
Sends an auto-reply and logs it. Returns boolean success.

## 🎯 Best Practices

1. **Message Templates**
   - Keep messages friendly and professional
   - Include expected response time
   - Add contact info for urgent matters

2. **Business Hours**
   - Set realistic hours matching your availability
   - Consider time zones for customers

3. **Cooldown Period**
   - 12 hours is recommended default
   - Shorter for high-touch businesses
   - Longer to avoid feeling robotic

4. **Vacation Mode**
   - Set dates in advance
   - Update return date if plans change
   - Disable when you return

5. **Testing**
   - Always test before vacation
   - Use test function regularly
   - Monitor auto-responder log

## 🚧 Future Enhancements

Potential additions:
- Multi-language support
- Custom business hours per day of week
- Multiple message templates per mode
- Schedule auto-responder in advance
- Analytics dashboard for auto-replies
- Integration with order status updates

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review database logs in Supabase
3. Test using the built-in test function
4. Check auto-responder log table for sent replies

---

**Status**: ✅ Fully Implemented
**Last Updated**: 2025-11-09
**Version**: 1.0.0

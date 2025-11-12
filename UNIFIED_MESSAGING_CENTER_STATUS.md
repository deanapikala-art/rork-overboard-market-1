# Unified Messaging Center Implementation Status

## ✅ Completed

### 1. Database Schema (`app/utils/messagingCenterSchema.sql`)
- ✅ Conversations table with participants, type (Order/Support/General), order linking
- ✅ Messages table with sender info, attachments, system types (status/note)
- ✅ Read receipts table for tracking message reads
- ✅ Typing indicators table for real-time typing status
- ✅ Blocks/Reports table for moderation
- ✅ Canned replies table for vendor quick responses
- ✅ RLS policies for security
- ✅ Triggers for auto-updating conversation timestamps
- ✅ Default canned reply templates

### 2. Context Provider (`app/contexts/MessagingCenterContext.tsx`)
- ✅ State management for conversations, messages, typing indicators
- ✅ Real-time subscriptions for messages and typing indicators
- ✅ Load conversations with filters (all, unread, orders, support, archived)
- ✅ Search conversations
- ✅ Create or open conversations
- ✅ Send messages with attachments
- ✅ Send typing indicators
- ✅ Mark messages as read
- ✅ Archive/unarchive conversations
- ✅ Image and document picker integration
- ✅ Canned replies management
- ✅ Report conversations
- ✅ User role and ID management

### 3. Inbox Screen (`app/messages/inbox.tsx`)
- ✅ Conversations list with filters
- ✅ Search functionality
- ✅ Unread badges and counts
- ✅ Order ID badges for order conversations
- ✅ Empty states for each filter
- ✅ Pull to refresh
- ✅ iOS-style design
- ✅ Responsive layout

## 🔄 In Progress / TODO

### 4. Thread View Screen (`app/messages/thread.tsx`)
**NEEDS TO BE CREATED**

Should include:
- Message list with bubbles (sent vs received styling)
- Read receipts per message
- Typing indicator display
- Message composer with text input
- Attachment buttons (image, document)
- Attachment previews in messages
- Order context card (if type='Order')
- Quick actions: View Order, Mark as Resolved
- Vendor canned replies button (for vendors)
- Admin internal note button (for admins)
- Auto-scroll to bottom on new message
- Loading states and error handling

### 5. Wrap App in MessagingCenterProvider (`app/_layout.tsx`)
**NEEDS INTEGRATION**

Add MessagingCenterProvider to the root layout, nested inside QueryClientProvider:

```tsx
import { MessagingCenterProvider } from './contexts/MessagingCenterContext';

// In RootLayoutNav:
<QueryClientProvider client={queryClient}>
  <MessagingCenterProvider>
    {/* existing providers */}
  </MessagingCenterProvider>
</QueryClientProvider>
```

### 6. Integration Points

#### Order Details Page (`app/order/[id].tsx`)
Add "Message Vendor" button that:
```tsx
import { useMessagingCenter } from '@app/contexts/MessagingCenterContext';

const { createOrOpenConversation } = useMessagingCenter();

const handleMessageVendor = async () => {
  const conversationID = await createOrOpenConversation({
    type: 'Order',
    orderID: order.id,
    participants: [
      { userID: customerID, role: 'customer', name: customerName },
      { userID: vendorID, role: 'vendor', name: vendorName }
    ]
  });
  router.push(`/messages/thread?id=${conversationID}`);
};
```

#### Vendor Profile Page (`app/vendor/[id].tsx`)
Add "Contact Vendor" button for general inquiries

#### Admin Dashboard (`app/(tabs)/admin.tsx`)
Add "Start Support Conversation" feature

### 7. Notification Integration

Connect to existing notification systems:
- When new message arrives → trigger CustomerNotifications or VendorNotifications
- Include conversationID and orderID in notification payload
- Tapping notification should open thread view

### 8. Canned Replies UI
Create modal/bottom sheet for vendors to select from canned replies:
- List default + custom replies
- Filter by category
- Insert reply text into composer
- Option to edit before sending

### 9. Admin Internal Notes
- When admin is in thread, show "Add Internal Note" button
- Notes visible only to admins
- Displayed with different styling (yellow background?)
- Useful for tracking moderation actions

### 10. Testing Checklist

- [ ] Customer can message vendor from order page
- [ ] Vendor receives real-time message notification
- [ ] Read receipts update correctly
- [ ] Typing indicators work smoothly
- [ ] Image attachments upload and display
- [ ] PDF attachments open correctly
- [ ] Search finds conversations by name, order ID, message content
- [ ] Filters work (unread, orders, support, archived)
- [ ] Archive/unarchive persists correctly
- [ ] Canned replies insert properly (vendor only)
- [ ] Admin internal notes invisible to non-admins
- [ ] Order context card links to correct order
- [ ] Web compatibility (no React Native Web crashes)
- [ ] Mobile performance (smooth scrolling, no lag)

## Database Setup Instructions

1. Run the schema file in your Supabase SQL editor:
   ```sql
   -- Copy and run app/utils/messagingCenterSchema.sql
   ```

2. Verify tables created:
   - conversations
   - messages
   - read_receipts
   - typing_indicators
   - blocks_reports
   - canned_replies

3. Check RLS policies are enabled and correct

4. Verify default canned replies inserted

## Usage Example

```tsx
import { useMessagingCenter } from '@app/contexts/MessagingCenterContext';

function MyComponent() {
  const {
    loadConversations,
    createOrOpenConversation,
    sendMessage,
    messages
  } = useMessagingCenter();

  useEffect(() => {
    loadConversations('all');
  }, []);

  const startConversation = async () => {
    const convID = await createOrOpenConversation({
      type: 'Order',
      orderID: 'ORD-123',
      participants: [
        { userID: 'user1', role: 'customer', name: 'John' },
        { userID: 'user2', role: 'vendor', name: 'Shop' }
      ]
    });
    
    await sendMessage(convID, 'Hello!');
  };
}
```

## Architecture Notes

### Participants Structure
Stored as JSONB array:
```json
[
  { "userID": "abc123", "role": "customer", "name": "John Doe", "avatar": "https://..." },
  { "userID": "def456", "role": "vendor", "name": "Cool Shop" }
]
```

### Message Flow
1. User types → sendTypingIndicator(true)
2. User sends → sendMessage()
3. Trigger updates conversation.lastMessagePreview
4. Real-time subscription delivers to other participants
5. Recipients see new message
6. When opened → markAsRead() called
7. Read receipt stored
8. Sender sees "Seen" indicator

### Performance Considerations
- Messages paginated (25 per load) with infinite scroll
- Typing indicators auto-expire after 30 seconds
- Conversations load only for current user (RLS enforced)
- Attachments stored as URIs (not base64) to reduce payload
- Subscriptions cleaned up on unmount

## Next Steps

1. Create `app/messages/thread.tsx` with full thread UI
2. Add MessagingCenterProvider to `app/_layout.tsx`
3. Integrate "Message Vendor" buttons in order and vendor pages
4. Test end-to-end flow
5. Add push notifications for new messages
6. Build admin moderation tools

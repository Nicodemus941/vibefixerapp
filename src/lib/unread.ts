// Helper to determine whether a conversation has unread messages
// relative to a given user.
//
// A conversation is "unread" for user U when there exists a message
// from the OTHER party whose created_at is newer than U's read_at.
export function isConvoUnread(
  convo: {
    buyer_id: string;
    seller_id: string;
    buyer_read_at: string | null;
    seller_read_at: string | null;
  },
  messages: Array<{ sender_id: string; created_at: string }>,
  userId: string,
): boolean {
  if (convo.buyer_id !== userId && convo.seller_id !== userId) return false;
  const myReadAt =
    convo.buyer_id === userId ? convo.buyer_read_at : convo.seller_read_at;
  const threshold = myReadAt ? new Date(myReadAt).getTime() : 0;
  return messages.some(
    (m) => m.sender_id !== userId && new Date(m.created_at).getTime() > threshold,
  );
}

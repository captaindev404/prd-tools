/**
 * Collaborative Comments Component
 *
 * Real-time comment thread for feedback triage collaboration
 */

'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send } from 'lucide-react';
import { Comment } from '@/lib/websocket/client';
import { formatDistanceToNow } from 'date-fns';

interface CollaborativeCommentsProps {
  comments: Comment[];
  onAddComment: (content: string, parentId?: string) => void;
  feedbackId?: string;
}

export function CollaborativeComments({
  comments,
  onAddComment,
  feedbackId,
}: CollaborativeCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    onAddComment(newComment);
    setNewComment('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    onAddComment(replyContent, parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  // Filter comments for current feedback if specified
  const filteredComments = feedbackId
    ? comments.filter((c) => c.feedbackId === feedbackId)
    : comments;

  const topLevelComments = filteredComments.filter((c) => !c.parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        <span>Live Collaboration Comments</span>
        <span className="text-muted-foreground">
          ({filteredComments.length})
        </span>
      </div>

      {/* New Comment Input */}
      <Card className="p-4">
        <Textarea
          placeholder="Add a comment to this collaboration session..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmitComment();
            }
          }}
        />
        <div className="mt-2 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Cmd/Ctrl + Enter to send
          </span>
          <Button
            size="sm"
            onClick={handleSubmitComment}
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            Comment
          </Button>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          topLevelComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onSetReplyingTo={setReplyingTo}
              onSetReplyContent={setReplyContent}
              onSubmitReply={handleSubmitReply}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  replyingTo,
  replyContent,
  onSetReplyingTo,
  onSetReplyContent,
  onSubmitReply,
}: {
  comment: Comment;
  replyingTo: string | null;
  replyContent: string;
  onSetReplyingTo: (id: string | null) => void;
  onSetReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatarUrl} alt={comment.author.displayName} />
          <AvatarFallback>
            {getInitials(comment.author.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {comment.author.displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSetReplyingTo(comment.id)}
            className="h-7 px-2 text-xs"
          >
            Reply
          </Button>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => onSetReplyContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onSetReplyingTo(null);
                    onSetReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3 border-l-2 border-muted pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={reply.author.avatarUrl} alt={reply.author.displayName} />
                    <AvatarFallback className="text-xs">
                      {getInitials(reply.author.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs">
                        {reply.author.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs mt-1 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

interface UserCardProps {
  user: {
    username: string;
    points?: number;
    rank?: number;
    avatar?: string;
    totalPoints?: number;
  };
  onClick?: () => void;
  showRank?: boolean;
  showPoints?: boolean;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onClick, 
  showRank = true, 
  showPoints = true,
  className = "" 
}) => {
  return (
    <Card className={`cursor-pointer hover:bg-muted/50 transition-colors ${className}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback>
              {user.username?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.username}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {showPoints && (
                <span>{user.points || 0} pontos</span>
              )}
              {showRank && showPoints && <span>•</span>}
              {showRank && (
                <span>#{user.rank || '-'}</span>
              )}
            </div>
          </div>
          {user.rank && user.rank <= 3 && (
            <div className="text-lg">
              {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
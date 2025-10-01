import React, { useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { useAuthStore } from "./auth-store";
import { SystemAPI } from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  ArrowLeft,
  Trophy,
  Target,
  Medal,
  Zap,
  Star,
  Heart,
  Coffee,
  Skull,
  Brain,
  Rocket,
  Shield,
  Sword,
  Diamond,
  Moon,
  Sun,
  Mountain,
  Flame,
  Gem,
  Sparkles,
  Bolt,
  Crown,
  Award,
  Gift,
  Smile,
  Angry,
  Lightbulb,
  BookOpen,
  Music,
  Gamepad2,
  Infinity,
} from "lucide-react";
import {
  calculateAchievements,
  getUserTitle,
  calculateEarnedTitles,
  getAllTitles,
} from "./achievements-definitions";

interface UserProfileProps {
  targetUser: string;
  onBackToOwnProfile: () => void;
  onNavigateToProfile?: (username: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  targetUser,
  onBackToOwnProfile,
  onNavigateToProfile,
}) => {
  const { user: currentUser } = useAuth();
  const { getLeaderboard, pointRecords } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Load target user data using /users endpoint
  useEffect(() => {
    const loadUser = async () => {
      if (targetUser && currentUser) {
        setIsLoading(true);
        try {
          const response = await SystemAPI.getUsers();
          if (response.success && response.users) {
            const foundUser = response.users.find(
              (u) => u.username === targetUser,
            );
            if (foundUser) {
              setUser(foundUser);
            } else {
              console.error("Usuário não encontrado na lista");
            }
          }
        } catch (error) {
          console.error("Erro ao carregar usuário:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUser();
  }, [targetUser, currentUser]);

  // Calculate achievements using unified definitions
  const getUserAchievements = () => {
    if (!user?.id || !pointRecords) return [];

    const userRecords = pointRecords.filter(
      (record) => record?.userId === user.id,
    );
    const totalPoints = user?.points || 0;
    const leaderboard = getLeaderboard() || [];
    const userRank =
      leaderboard.findIndex((u) => u?.id === user.id) + 1;

    return calculateAchievements(
      userRecords,
      totalPoints,
      userRank,
    );
  };

  const achievements = getUserAchievements();

  // Calculate user title using unified functions
  const userTitle = getUserTitle(
    achievements,
    undefined,
    false,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBackToOwnProfile}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao meu perfil
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Usuário não encontrado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Perfil de {user.username}</h1>
        <p className="text-muted-foreground">
          Visualizando perfil de outro usuário
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button onClick={onBackToOwnProfile} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao meu perfil
        </Button>
      </div>

      {/* User Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={user.avatar}
                alt={user.username}
              />
              <AvatarFallback className="text-lg">
                {user.username?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>
                {user.username || "Usuário"}
              </CardTitle>
              <div className="my-2">
                <div
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-white font-medium text-sm shadow-lg title-badge badge-glow ${userTitle.color}`}
                >
                  <span className="drop-shadow-sm">
                    {userTitle.title}
                  </span>
                </div>
              </div>
              <CardDescription>
                {user.createdAt
                  ? `Usuário desde ${new Date(user.createdAt).toLocaleDateString("pt-BR")}`
                  : "Novo usuário"}
              </CardDescription>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                <Badge className="w-fit">{user.points || 0} pontos atuais</Badge>
                <Badge variant="outline" className="w-fit">
                  #{user.rank || "-"} no ranking
                </Badge>
                <Badge variant="secondary" className="w-fit">
                  {
                    achievements.filter((a) => a.unlocked)
                      .length
                  }
                  /{achievements.length} conquistas
                </Badge>
              </div>
              {user.totalPoints !== user.points && (
                <div className="text-sm text-muted-foreground mt-1">
                  {user.totalPoints || 0} pontos históricos
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {user.bio && (
            <div className="space-y-2">
              <h4>Sobre</h4>
              <p className="text-muted-foreground">
                {user.bio}
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">
                {user.points || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Pontos
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                #{user.rank || "-"}
              </div>
              <div className="text-sm text-muted-foreground">
                Ranking
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {achievements.filter((a) => a.unlocked).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Conquistas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Conquistas (
            {achievements.filter((a) => a.unlocked).length}/
            {achievements.length})
          </CardTitle>
          <CardDescription>
            Conquistas desbloqueadas por este usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter((achievement) => achievement.unlocked)
              .sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return (
                  new Date(b.date).getTime() -
                  new Date(a.date).getTime()
                );
              })
              .map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Desbloqueada em {achievement.date}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {achievements.filter((a) => a.unlocked).length ===
            0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conquista desbloqueada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Títulos Conquistados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Títulos Conquistados
          </CardTitle>
          <CardDescription>
            Todos os títulos que {user.username} desbloqueou
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {calculateEarnedTitles(achievements).map(
              (titleInfo) => (
                <div
                  key={titleInfo.id}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 title-badge ${titleInfo.color} text-white shadow-lg`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {titleInfo.title}
                      </h4>
                      <p className="text-sm opacity-90">
                        {titleInfo.description}
                      </p>
                    </div>
                    {titleInfo.id ===
                      getAllTitles().find(
                        (t) => userTitle.title === t.title,
                      )?.id && (
                      <Badge className="bg-white/20 text-white border-white/20">
                        Atual
                      </Badge>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>

          {calculateEarnedTitles(achievements).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum título conquistado ainda.</p>
              <p className="text-sm">
                Complete conquistas para desbloquear títulos!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
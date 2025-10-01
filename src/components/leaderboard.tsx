import React, { useState, useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, TrendingUp, Medal, Crown } from 'lucide-react';

interface LeaderboardProps {
  onNavigateToProfile?: (username: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onNavigateToProfile }) => {
  const { 
    getLeaderboard, 
    syncWithServer, 
    isLoading, 
    totalUsers,
    lastSync
  } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState('geral');

  // Auto refresh data
  useEffect(() => {
    syncWithServer();
    
    const interval = setInterval(() => {
      syncWithServer();
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [syncWithServer]);



  // Get real leaderboard data from server
  const allUsers = getLeaderboard() || [];
  const realLeaderboardData = allUsers.filter(Boolean).map((user) => ({
    rank: user?.rank || 0,
    name: user?.username || 'Usuário',
    points: user?.points || 0,
    totalPoints: user?.totalPoints || 0,
    seasonPoints: user?.points || 0,
    userId: user?.id,
    achievements: user?.achievements || [],
    joinedAt: user?.joinedAt || user?.createdAt
  }));

  // Simplificar leaderboards (dados baseados no servidor)
  const weeklyLeaderboard = realLeaderboardData.slice(0, 10);
  const monthlyLeaderboard = realLeaderboardData.slice(0, 10);

  // Use the appropriate leaderboard data
  const leaderboardData = realLeaderboardData;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const LeaderboardTable = ({ data }: { data: any[] }) => (
    <div className="space-y-2">
      {data.length > 0 ? (
        data.map((user, index) => (
          <div
            key={user?.rank || index}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
              index < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent border-primary/20' : 'bg-card'
            }`}
            onClick={() => onNavigateToProfile?.(user?.name)}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadgeColor(user?.rank || index + 1)}`}>
              {(user?.rank || index + 1) <= 3 ? getRankIcon(user?.rank || index + 1) : <span className="text-sm font-bold">{user?.rank || index + 1}</span>}
            </div>
            
            <Avatar className="w-10 h-10">
              <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <p className="font-medium">{user?.name || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground">{user?.points || 0} pontos</p>
            </div>
            
            <Badge 
              variant="secondary"
              className="text-xs"
            >
              #{user?.rank || index + 1}
            </Badge>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum usuário encontrado neste período.</p>
          <p className="text-sm">Registre alguns pontos para aparecer no ranking!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Leaderboard</h1>
        <p className="text-muted-foreground">
          Rankings dos usuários mais ativos na plataforma
        </p>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Sincronizando rankings...
          </div>
        )}
        {lastSync && (
          <p className="text-xs text-muted-foreground mt-1">
            Última sincronização: {new Date(lastSync).toLocaleTimeString('pt-BR')} | {totalUsers} usuários online
          </p>
        )}
      </div>

      {/* Top 3 Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Pódio Geral
          </CardTitle>
          <CardDescription>
            Os três primeiros colocados da temporada atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboardData.length >= 1 ? (
            leaderboardData.length >= 3 ? (
            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="text-center order-1">
                <div className="relative">
                  <div className="w-16 h-20 bg-gradient-to-r from-gray-300 to-gray-500 rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2">
                    <span className="text-white font-bold">2º</span>
                  </div>
                  <Avatar className="w-12 h-12 mx-auto -mt-6 border-2 border-background">
                    <AvatarFallback>{leaderboardData[1]?.name?.charAt(0)?.toUpperCase() || '2'}</AvatarFallback>
                  </Avatar>
                </div>
                <p className="font-medium mt-2">{leaderboardData[1]?.name || 'Aguardando...'}</p>
                <p className="text-sm text-muted-foreground">{leaderboardData[1]?.points || 0} pontos</p>
              </div>

              {/* 1st Place */}
              <div className="text-center order-2">
                <div className="relative">
                  <div className="w-16 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <Avatar className="w-14 h-14 mx-auto -mt-7 border-2 border-background">
                    <AvatarFallback>{leaderboardData[0]?.name?.charAt(0)?.toUpperCase() || '1'}</AvatarFallback>
                  </Avatar>
                </div>
                <p className="font-medium mt-2">{leaderboardData[0]?.name || 'Aguardando...'}</p>
                <p className="text-sm text-muted-foreground">{leaderboardData[0]?.points || 0} pontos</p>
                <Badge className="mt-1">Campeão</Badge>
              </div>

              {/* 3rd Place */}
              <div className="text-center order-3">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2">
                    <span className="text-white font-bold">3º</span>
                  </div>
                  <Avatar className="w-10 h-10 mx-auto -mt-5 border-2 border-background">
                    <AvatarFallback>{leaderboardData[2]?.name?.charAt(0)?.toUpperCase() || '3'}</AvatarFallback>
                  </Avatar>
                </div>
                <p className="font-medium mt-2">{leaderboardData[2]?.name || 'Aguardando...'}</p>
                <p className="text-sm text-muted-foreground">{leaderboardData[2]?.points || 0} pontos</p>
              </div>
            </div>
            ) : (
              // Mostrar podium parcial quando há menos de 3 usuários
              <div className="flex justify-center items-end gap-4">
                {leaderboardData.slice(0, 3).map((userData, index) => {
                  const positions = [
                    { height: 'h-24', color: 'from-yellow-400 to-yellow-600', icon: <Crown className="h-6 w-6 text-white" />, label: 'Campeão' },
                    { height: 'h-20', color: 'from-gray-300 to-gray-500', icon: <span className="text-white font-bold">2º</span>, label: null },
                    { height: 'h-16', color: 'from-orange-400 to-orange-600', icon: <span className="text-white font-bold">3º</span>, label: null }
                  ];
                  const position = positions[index];
                  
                  return (
                    <div key={userData.userId} className="text-center">
                      <div className="relative">
                        <div className={`w-16 ${position.height} bg-gradient-to-r ${position.color} rounded-t-lg mx-auto mb-2 flex items-end justify-center pb-2`}>
                          {position.icon}
                        </div>
                        <Avatar className={`${index === 0 ? 'w-14 h-14 -mt-7' : index === 1 ? 'w-12 h-12 -mt-6' : 'w-10 h-10 -mt-5'} mx-auto border-2 border-background`}>
                          <AvatarFallback>{userData?.name?.charAt(0)?.toUpperCase() || (index + 1)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="font-medium mt-2">{userData?.name || 'Aguardando...'}</p>
                      <p className="text-sm text-muted-foreground">{userData?.points || 0} pontos</p>
                      {position.label && <Badge className="mt-1">{position.label}</Badge>}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {leaderboardData.length === 0 ? 
                  'Ainda não há usuários registrados. Seja o primeiro!' :
                  `Precisamos de pelo menos 3 usuários para mostrar o pódio. Atualmente: ${leaderboardData.length}`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings Detalhados</CardTitle>
          <CardDescription>
            Visualize os rankings por diferentes períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="semanal">Semanal</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="geral" className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Ranking Geral da Temporada</span>
              </div>
              <LeaderboardTable data={leaderboardData} />
            </TabsContent>
            
            <TabsContent value="semanal" className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Top 5 da Semana</span>
              </div>
              <LeaderboardTable data={weeklyLeaderboard} />
            </TabsContent>
            
            <TabsContent value="mensal" className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Medal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Top 5 do Mês</span>
              </div>
              <LeaderboardTable data={monthlyLeaderboard} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Jogadores</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaderboardData.length}</div>
            <p className="text-xs text-muted-foreground">
              ativos na temporada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Distribuídos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboardData.reduce((sum, user) => sum + (user?.points || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              total da temporada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Pontos</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboardData.length > 0 ? 
                Math.round(leaderboardData.reduce((sum, user) => sum + (user?.points || 0), 0) / leaderboardData.length) : 
                0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              por jogador
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
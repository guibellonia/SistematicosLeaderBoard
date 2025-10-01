import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
import { SystemAPI } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Clock, Target, Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { UserCard } from './user-card';

// Motivos de pontos atualizados
const pointReasons = [
  // Motivos Acadêmicos
  { id: 'avaliacao-total', label: 'Tirar total em avaliação', points: 25 },
  { id: 'avaliacao-9', label: 'Tirar 9+ em avaliação', points: 15 },
  { id: 'trabalho-excelente', label: 'Entregar trabalho excelente', points: 20 },
  { id: 'apresentacao-aula', label: 'Fazer apresentação em aula', points: 12 },
  { id: 'resolver-aps', label: 'Resolver APS', points: 8 },
  { id: 'participar-aula', label: 'Participação ativa na aula', points: 5 },
  
  // Motivos Técnicos
  { id: 'resolver-problema', label: 'Resolver problema complexo', points: 20 },
  { id: 'documentacao', label: 'Escrever documentação', points: 8 },
  { id: 'review-codigo', label: 'Review de código detalhado', points: 6 },
  { id: 'bug-fix', label: 'Corrigir bug crítico', points: 15 },
  { id: 'feature-nova', label: 'Implementar nova funcionalidade', points: 18 },
  { id: 'otimizacao', label: 'Otimizar performance', points: 12 },
  
  // Motivos Sociais
  { id: 'ajudar-colega', label: 'Ajudar um colega', points: 10 },
  { id: 'mentoria', label: 'Dar mentoria para alguém', points: 15 },
  { id: 'explicar-materia', label: 'Explicar matéria para a turma', points: 12 },
  { id: 'trabalho-grupo', label: 'Liderar trabalho em grupo', points: 10 },
  
  // Motivos de Eventos
  { id: 'primeiro-expotech', label: 'Primeiro Lugar na ExpoTech', points: 100 },
  { id: 'segundo-expotech', label: 'Segundo Lugar na ExpoTech', points: 80 },
  { id: 'terceiro-expotech', label: 'Terceiro Lugar na ExpoTech', points: 60 },
  { id: 'participar-expotech', label: 'Participar da ExpoTech', points: 20 },
  { id: 'hackathon-winner', label: 'Ganhar Hackathon', points: 75 },
  { id: 'hackathon-participant', label: 'Participar de Hackathon', points: 25 },
  { id: 'palestra', label: 'Dar palestra', points: 30 },
  { id: 'workshop', label: 'Ministrar workshop', points: 25 },
  { id: 'participar-evento', label: 'Participar de evento acadêmico', points: 8 },
  
  // Motivos Especiais/Humorísticos
  { id: 'xingar-henaldo', label: 'Xingar o Henaldo', points: 15 },
  { id: 'coffee-break', label: 'Organizar coffee break', points: 5 },
  { id: 'meme-engracado', label: 'Fazer meme engraçado da turma', points: 3 },
  { id: 'chegada-pontual', label: 'Chegar pontualmente por uma semana', points: 8 },
  { id: 'limpar-lab', label: 'Limpar o laboratório', points: 6 },
];

interface DashboardProps {
  onNavigateToProfile?: (username: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToProfile }) => {
  const { user } = useAuth();
  const { 
    pointRecords, 
    addPointRecord, 
    getLeaderboard, 
    getHistory,
    isLoading,
    error,
    clearError,
    refreshData,
    syncWithServer
  } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [historyData, setHistoryData] = useState<{ history: any[]; total: number; totalPages: number }>({
    history: [],
    total: 0,
    totalPages: 0
  });
  const recordsPerPage = 10;

  // Load global history data and users info
  const loadGlobalHistory = async () => {
    try {
      const [historyResponse, usersResponse] = await Promise.all([
        SystemAPI.getGlobalHistory(currentPage, recordsPerPage),
        SystemAPI.getUsers()
      ]);
      
      if (historyResponse.success) {
        // Enrich history data with user info from /users endpoint
        const enrichedHistory = historyResponse.history.map(record => {
          const userInfo = usersResponse.users?.find(u => u.username === record.username);
          return {
            ...record,
            avatar: userInfo?.avatar || record.avatar,
            userPoints: userInfo?.points || 0,
            userRank: userInfo?.rank || 0
          };
        });
        
        setHistoryData({
          ...historyResponse,
          history: enrichedHistory
        });
      }
    } catch (error) {
      console.error('Erro ao carregar histórico global:', error);
    }
  };

  // Load current season info
  useEffect(() => {
    const loadSeasonInfo = async () => {
      try {
        const seasonResponse = await SystemAPI.getCurrentSeason();
        if (seasonResponse.success) {
          setCurrentSeason(seasonResponse.season);
        }
      } catch (error) {
        console.error('Erro ao carregar informações da temporada:', error);
      }
    };
    loadSeasonInfo();
  }, []);

  useEffect(() => {
    loadGlobalHistory();
  }, [currentPage]);

  // Auto refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        syncWithServer();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [user, syncWithServer]);

  const allUsers = getLeaderboard() || [];
  const leaderboardData = allUsers.slice(0, 5).map((userData, index) => ({
    rank: userData.rank || (index + 1),
    name: userData?.username || 'Usuário',
    points: userData?.points || 0,
    change: null
  }));

  // Calculate stats from history - only for current user
  const todayRecords = historyData.history.filter(record => {
    if (!record?.timestamp || !record?.username) return false;
    // Filter only records from current user
    if (record.username !== user?.username) return false;
    try {
      const recordDate = new Date(record.timestamp).toDateString();
      const today = new Date().toDateString();
      return recordDate === today;
    } catch {
      return false;
    }
  });
  const todayPoints = todayRecords.reduce((sum, record) => sum + (record?.points || 0), 0);

  const handleRegisterPoint = async () => {
    if (!selectedReason) {
      toast.error('Selecione um motivo para registrar o ponto');
      return;
    }
    
    const reason = pointReasons.find(r => r.id === selectedReason);
    if (reason) {
      setIsAddingPoint(true);
      try {
        console.log(`🎯 Registrando ponto: ${reason.label} (+${reason.points})`);
        await addPointRecord(reason.label, reason.points, reason.id);
        toast.success(`Ponto registrado! +${reason.points} pontos por "${reason.label}"`);
        setSelectedReason('');
        
        // Refresh global history instead of individual history
        await loadGlobalHistory();
      } catch (error) {
        console.error('❌ Erro ao registrar ponto:', error);
        toast.error('Erro ao registrar ponto. Tente novamente.');
      } finally {
        setIsAddingPoint(false);
      }
    }
  };

  const handleResetSeason = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isto irá zerar os pontos de TODOS os usuários na temporada atual. Esta ação não pode ser desfeita. Continuar?')) {
      return;
    }
    
    try {
      console.log('🔄 Iniciando reset da temporada...');
      const response = await SystemAPI.resetSeason();
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error('❌ Erro ao resetar temporada');
      }
    } catch (error) {
      console.error('❌ Erro no reset:', error);
      toast.error('❌ Erro ao resetar temporada');
    }
  };

  const handleCleanupUsers = async () => {
    if (!confirm('🧹 ATENÇÃO: Isto irá remover usuários antigos que não estão no sistema de autenticação. Deseja continuar?')) {
      return;
    }
    
    try {
      console.log('🧹 Iniciando limpeza de usuários...');
      const response = await SystemAPI.cleanupUsers();
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error('❌ Erro na limpeza de usuários');
      }
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      toast.error('❌ Erro na limpeza de usuários');
    }
  };

  const handleFinalizeSeason = async () => {
    if (!confirm('🏆 ATENÇÃO: Isto irá finalizar a temporada atual, atribuir vencedores e criar uma nova temporada. Esta ação não pode ser desfeita. Continuar?')) {
      return;
    }
    
    try {
      console.log('🏆 Finalizando temporada...');
      const response = await SystemAPI.finalizeSeason();
      if (response.success) {
        toast.success(`🎉 ${response.message}`);
        // Show winners
        if (response.winners) {
          const winnersMessage = `🥇 1º: ${response.winners.first?.username || 'N/A'}\n🥈 2º: ${response.winners.second?.username || 'N/A'}\n🥉 3º: ${response.winners.third?.username || 'N/A'}`;
          toast.success(`Vencedores da temporada:\n${winnersMessage}`, { duration: 8000 });
        }
        // Update season info
        if (response.newSeason) {
          setCurrentSeason(response.newSeason);
        }
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error('❌ Erro ao finalizar temporada');
      }
    } catch (error) {
      console.error('❌ Erro ao finalizar:', error);
      toast.error('❌ Erro ao finalizar temporada');
    }
  };

  const currentDateTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const userRank = leaderboardData.findIndex(u => u?.name === user?.username) + 1 || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.username}!
          </p>
          {currentSeason && (
            <p className="text-sm text-primary font-medium">
              📅 {currentSeason.title || `Temporada ${currentSeason.number} ${currentSeason.year}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Bellonia controls - mostrar apenas para bellonia */}
          {user?.username === 'bellonia' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleFinalizeSeason}
              className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              🏆 Finalizar Temporada
            </Button>
          )}

          {/* Admin controls - mostrar apenas para admins */}
          {(user?.username === 'admin' || user?.username === 'dev' || user?.username === 'moderator') && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupUsers}
                className="text-xs"
              >
                🧹 Limpar Usuários
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetSeason}
                className="text-xs"
              >
                🔄 Reset Temporada
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {currentDateTime}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          Sincronizando dados...
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg">
          <p className="text-sm">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => { clearError(); refreshData(); }}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Pontos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.points || 0}</div>
            <p className="text-xs text-muted-foreground">
              {user?.totalPoints ? `${user.totalPoints} pontos históricos` : 'Total acumulado'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{user?.rank || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {allUsers.length > 0 ? `de ${allUsers.length} usuários` : 'no leaderboard geral'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Hoje</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayPoints}</div>
            <p className="text-xs text-muted-foreground">
              {todayRecords.length} registros feitos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Point Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Ponto</CardTitle>
            <CardDescription>
              Registre suas atividades e ganhe pontos no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label>Motivo do Ponto</label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {pointReasons.map((reason) => (
                    <SelectItem key={reason.id} value={reason.id}>
                      {reason.label} (+{reason.points} pontos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Data e hora: {currentDateTime}</p>
              <p>Usuário: {user?.username}</p>
            </div>
            
            <Button onClick={handleRegisterPoint} className="w-full" disabled={isAddingPoint || !selectedReason}>
              {isAddingPoint ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Ponto
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              Top 5 usuários com mais pontos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.length > 0 ? (
                leaderboardData.map((user, index) => (
                  <UserCard
                    key={user?.rank || index}
                    user={{
                      username: user?.name || 'Usuário',
                      points: user?.points || 0,
                      rank: user?.rank || index + 1,
                      avatar: user?.avatar
                    }}
                    onClick={() => onNavigateToProfile?.(user?.name)}
                    className="mb-2"
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Nenhum usuário no ranking ainda.</p>
                  <p className="text-sm">Seja o primeiro a pontuar!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Point Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Global</CardTitle>
          <CardDescription>
            Acompanhe em tempo real todos os usuários que estão registrando pontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.history.length > 0 ? (
                historyData.history.map((record) => (
                  <TableRow key={record?.id || Math.random()}>
                    <TableCell>
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onNavigateToProfile?.(record?.username)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record?.avatar} alt={record?.username} />
                          <AvatarFallback>{record?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{record?.username || 'Usuário'}</div>
                          <div className="text-sm text-muted-foreground">
                            {record?.userPoints ? `${record.userPoints} pts • #${record.userRank || '-'}` : 'Novo usuário'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record?.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      {pointReasons.find(r => r.id === record?.reason)?.label || record?.reason || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">+{record?.points || 0}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado. Registre seu primeiro ponto!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {historyData.totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {[...Array(historyData.totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(historyData.totalPages, currentPage + 1))}
                      className={currentPage === historyData.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
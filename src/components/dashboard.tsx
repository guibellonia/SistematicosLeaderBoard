import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { useAuthStore } from './auth-store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination';
import { Clock, Target, Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Mock data for point reasons
const pointReasons = [
  { id: 'xingar-henaldo', label: 'Xingar o Henaldo', points: 15 },
  { id: 'avaliacao-total', label: 'Tirar total em avaliação', points: 25 },
  { id: 'ajudar-colega', label: 'Ajudar um colega', points: 10 },
  { id: 'participar-evento', label: 'Participar de evento', points: 8 },
  { id: 'resolver-problema', label: 'Resolver problema complexo', points: 20 },
  { id: 'apresentacao', label: 'Fazer apresentação', points: 12 },
  { id: 'documentacao', label: 'Escrever documentação', points: 8 },
  { id: 'review-codigo', label: 'Review de código detalhado', points: 6 },
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { pointRecords, addPointRecord, getLeaderboard } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Calculate pagination and get current data
  const allRecords = pointRecords || [];
  const totalPages = Math.max(1, Math.ceil(allRecords.length / recordsPerPage));
  const startIndex = (currentPage - 1) * recordsPerPage;
  const currentRecords = allRecords.slice(startIndex, startIndex + recordsPerPage);
  const allUsers = getLeaderboard() || [];
  const leaderboardData = allUsers.slice(0, 5).map((user, index) => ({
    rank: index + 1,
    name: user?.username || 'Usuário',
    points: user?.points || 0,
    change: null // Remover dados fake
  }));

  // Calculate stats
  const todayRecords = (pointRecords || []).filter(record => {
    if (!record?.timestamp || !record?.userId || !user?.id) return false;
    try {
      const recordDate = new Date(record.timestamp).toDateString();
      const today = new Date().toDateString();
      return recordDate === today && record.userId === user.id;
    } catch {
      return false;
    }
  });
  const todayPoints = todayRecords.reduce((sum, record) => sum + (record?.points || 0), 0);

  const handleRegisterPoint = () => {
    if (!selectedReason) {
      toast.error('Selecione um motivo para registrar o ponto');
      return;
    }
    
    const reason = pointReasons.find(r => r.id === selectedReason);
    if (reason) {
      addPointRecord(reason.label, reason.points);
      toast.success(`Ponto registrado! +${reason.points} pontos por "${reason.label}"`);
      setSelectedReason('');
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
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {currentDateTime}
        </div>
      </div>

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
              Total acumulado
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
              #{userRank > 0 ? userRank : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              no leaderboard geral
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
            
            <Button onClick={handleRegisterPoint} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Ponto
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
                  <div key={user?.rank || index} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {user?.rank || index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user?.name || 'Usuário'}</p>
                      <p className="text-sm text-muted-foreground">{user?.points || 0} pontos</p>
                    </div>

                  </div>
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
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>
            Últimos pontos registrados por todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length > 0 ? (
                currentRecords.map((record) => (
                  <TableRow key={record?.id || Math.random()}>
                    <TableCell className="font-medium">{record?.username || 'Usuário'}</TableCell>
                    <TableCell>
                      {record?.timestamp ? new Date(record.timestamp).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{record?.reason || '-'}</TableCell>
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
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
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
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
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
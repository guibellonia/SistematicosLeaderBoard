import React, { useState, useEffect } from "react";
import { useAuth } from "./auth-context";
import { useAuthStore } from "./auth-store";
import { SystemAPI } from "../utils/supabase/client";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";
import { Clock, Target, Plus, Trophy, Users, ChevronDown } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { UserCard } from "./user-card";

// Motivos de pontos organizados por categorias
const pointReasons = {
  academicos: [
    { id: "avaliacao-total", label: "Tirar total em avaliação", points: 25 },
    { id: "avaliacao-9", label: "Tirar 9+ em avaliação", points: 15 },
    { id: "trabalho-excelente", label: "Entregar trabalho excelente", points: 20 },
    { id: "apresentacao-aula", label: "Fazer apresentação em aula", points: 12 },
    { id: "resolver-aps", label: "Resolver APS", points: 8 },
    { id: "participar-aula", label: "Participação ativa na aula", points: 5 },
    { id: "seminario", label: "Apresentar seminário", points: 18 },
    { id: "projeto-final", label: "Entregar projeto final exemplar", points: 30 },
    { id: "monitoria", label: "Dar monitoria", points: 12 },
    { id: "estudo-grupo", label: "Organizar grupo de estudos", points: 10 },
  ],
  
  tecnicos: [
    { id: "resolver-problema", label: "Resolver problema complexo", points: 20 },
    { id: "documentacao", label: "Escrever documentação", points: 8 },
    { id: "review-codigo", label: "Review de código detalhado", points: 6 },
    { id: "bug-fix", label: "Corrigir bug crítico", points: 15 },
    { id: "feature-nova", label: "Implementar nova funcionalidade", points: 18 },
    { id: "otimizacao", label: "Otimizar performance", points: 12 },
    { id: "refatoracao", label: "Refatorar código legado", points: 14 },
    { id: "automacao", label: "Criar automação/script útil", points: 16 },
    { id: "deploy", label: "Fazer deploy sem quebrar nada", points: 10 },
    { id: "backup", label: "Salvar o projeto de disaster", points: 25 },
  ],

  confraternizacao: [
    { id: "organizar-churrasco", label: "Organizar churrasco da galera", points: 20 },
    { id: "participar-churrasco", label: "Participar do churrasco", points: 8 },
    { id: "trazer-bebida-churrasco", label: "Trazer bebida pro churrasco", points: 10 },
    { id: "fazer-carne-churrasco", label: "Fazer a carne no churrasco", points: 15 },
    { id: "organizar-festa", label: "Organizar festa da turma", points: 18 },
    { id: "aniversario", label: "Organizar aniversário de colega", points: 12 },
    { id: "coffee-break", label: "Organizar coffee break", points: 5 },
    { id: "happy-hour", label: "Organizar happy hour", points: 10 },
    { id: "amigo-secreto", label: "Organizar amigo secreto", points: 8 },
    { id: "karaoke", label: "Organizar karaokê da galera", points: 15 },
    { id: "pizza-noite", label: "Organizar pizza na madrugada", points: 12 },
    { id: "game-night", label: "Organizar noite de jogos", points: 10 },
  ],

  companheirismo: [
    { id: "ajudar-colega", label: "Ajudar um colega", points: 10 },
    { id: "mentoria", label: "Dar mentoria para alguém", points: 15 },
    { id: "explicar-materia", label: "Explicar matéria para a turma", points: 12 },
    { id: "trabalho-grupo", label: "Liderar trabalho em grupo", points: 10 },
    { id: "emprestar-material", label: "Emprestar material/equipamento", points: 5 },
    { id: "carona", label: "Dar carona para os colegas", points: 6 },
    { id: "lanche-compartilhar", label: "Compartilhar lanche com galera", points: 4 },
    { id: "consolar-colega", label: "Consolar colega após prova difícil", points: 8 },
    { id: "motivar-equipe", label: "Motivar a equipe", points: 10 },
    { id: "mediar-conflito", label: "Mediar conflito entre colegas", points: 15 },
    { id: "acolher-novato", label: "Acolher/integrar novato na turma", points: 12 },
    { id: "dividir-conhecimento", label: "Dividir conhecimento técnico", points: 8 },
  ],

  organizacao: [
    { id: "limpar-lab", label: "Limpar o laboratório", points: 6 },
    { id: "organizar-sala", label: "Organizar sala de aula", points: 5 },
    { id: "arrumacao-geral", label: "Fazer arrumação geral do espaço", points: 10 },
    { id: "equipamentos", label: "Organizar equipamentos/cabos", points: 8 },
    { id: "biblioteca", label: "Organizar materiais da biblioteca", points: 7 },
    { id: "quadro-limpo", label: "Limpar quadro após aula", points: 3 },
    { id: "lixo-reciclagem", label: "Separar lixo/reciclagem", points: 4 },
    { id: "manutencao-preventiva", label: "Fazer manutenção preventiva", points: 12 },
  ],

  engajamento: [
    { id: "meme-engracado", label: "Fazer meme engraçado da turma", points: 3 },
    { id: "foto-turma", label: "Organizar foto da turma", points: 8 },
    { id: "grupo-whatsapp", label: "Manter grupo WhatsApp ativo", points: 5 },
    { id: "rede-social", label: "Postar sobre a turma nas redes", points: 6 },
    { id: "chegada-pontual", label: "Chegar pontualmente por uma semana", points: 8 },
    { id: "frequencia-perfeita", label: "Frequência perfeita no mês", points: 15 },
    { id: "participacao-ativa", label: "Participação ativa em discussões", points: 7 },
    { id: "pergunta-inteligente", label: "Fazer pergunta que ajudou todos", points: 10 },
    { id: "ideia-projeto", label: "Sugerir ideia criativa para projeto", points: 12 },
    { id: "feedback-construtivo", label: "Dar feedback construtivo", points: 8 },
  ],

  eventos: [
    { id: "primeiro-expotech", label: "Primeiro Lugar na ExpoTech", points: 100 },
    { id: "segundo-expotech", label: "Segundo Lugar na ExpoTech", points: 80 },
    { id: "terceiro-expotech", label: "Terceiro Lugar na ExpoTech", points: 60 },
    { id: "participar-expotech", label: "Participar da ExpoTech", points: 20 },
    { id: "hackathon-winner", label: "Ganhar Hackathon", points: 75 },
    { id: "hackathon-participant", label: "Participar de Hackathon", points: 25 },
    { id: "palestra", label: "Dar palestra", points: 30 },
    { id: "workshop", label: "Ministrar workshop", points: 25 },
    { id: "participar-evento", label: "Participar de evento acadêmico", points: 8 },
    { id: "feira-profissoes", label: "Participar de feira de profissões", points: 10 },
    { id: "visita-empresa", label: "Organizar visita à empresa", points: 15 },
  ],

  xingamentos: [
    { id: "xingar-henaldo", label: "Xingar o Henaldo", points: 15 },
    { id: "xingar-professor-chato", label: "Xingar professor chato (respeitosamente)", points: 5 },
    { id: "reclamar-cantina", label: "Reclamar da comida da cantina", points: 2 },
    { id: "xingar-sistema", label: "Xingar sistema acadêmico bugado", points: 8 },
    { id: "criticar-infraestrutura", label: "Criticar infraestrutura da faculdade", points: 6 },
    { id: "xingar-internet", label: "Xingar internet lenta", points: 4 },
    { id: "reclamar-ar-condicionado", label: "Reclamar do ar condicionado", points: 3 },
    { id: "xingar-projetor", label: "Xingar projetor que não funciona", points: 3 },
    { id: "reclamar-cadeira", label: "Reclamar da cadeira desconfortável", points: 2 },
    { id: "xingar-elevador", label: "Xingar elevador sempre quebrado", points: 4 },
  ],

  situacoes: [
    { id: "chegar-antes-professor", label: "Chegar antes do professor pela primeira vez", points: 5 },
    { id: "sobreviver-segunda", label: "Sobreviver a segunda-feira de 8h", points: 10 },
    { id: "não-dormir-aula", label: "Não dormir numa aula chata", points: 8 },
    { id: "perguntar-duvida", label: "Perguntar dúvida que ninguém teve coragem", points: 12 },
    { id: "defender-colega", label: "Defender colega do professor bravo", points: 15 },
    { id: "fingir-entender", label: "Fingir que entendeu a explicação", points: 3 },
    { id: "acordar-cedo", label: "Acordar antes das 7h voluntariamente", points: 20 },
    { id: "trazer-lanche-saudavel", label: "Trazer lanche saudável (sem ser forçado)", points: 8 },
    { id: "aguentar-trabalho-grupo", label: "Aguentar trabalho em grupo sem brigar", points: 18 },
    { id: "apresentar-sem-ler", label: "Apresentar sem ler o slide", points: 25 },
    { id: "salvar-apresentacao", label: "Salvar apresentação quando deu erro", points: 20 },
    { id: "improvisar-projeto", label: "Improvisar projeto na última hora", points: 22 },
  ],

  diaadia: [
    { id: "cafe-turma", label: "Trazer café para toda turma", points: 10 },
    { id: "acordar-colega", label: "Acordar colega dormindo na aula", points: 5 },
    { id: "emprestar-carregador", label: "Emprestar carregador/powerbank", points: 3 },
    { id: "anotar-materia", label: "Anotar matéria para quem faltou", points: 7 },
    { id: "lembrar-prova", label: "Lembrar turma sobre prova/trabalho", points: 8 },
    { id: "criar-grupo-estudo", label: "Criar grupo de estudos no WhatsApp", points: 6 },
    { id: "resumo-materia", label: "Fazer resumo e compartilhar", points: 12 },
    { id: "xerox-galera", label: "Ir no xerox para a galera", points: 4 },
    { id: "pagar-lanche", label: "Pagar lanche de colega sem grana", points: 8 },
    { id: "buscar-agua", label: "Buscar água pro pessoal", points: 3 },
    { id: "guardar-lugar", label: "Guardar lugar na fila da cantina", points: 2 },
    { id: "dividir-uber", label: "Organizar divisão do Uber", points: 5 },
    { id: "trazer-doce", label: "Trazer doce/bolo para turma", points: 6 },
    { id: "emprestar-dinheiro", label: "Emprestar dinheiro (e não cobrar)", points: 10 },
    { id: "salvar-cadeira", label: "Guardar cadeira para colega", points: 2 },
    { id: "levar-casa", label: "Levar colega em casa", points: 6 },
    { id: "buscar-remedio", label: "Buscar remédio para colega", points: 8 },
  ],

  esportes: [
    { id: "organizar-pelada", label: "Organizar pelada da galera", points: 12 },
    { id: "goleiro-pelada", label: "Ser goleiro na pelada", points: 8 },
    { id: "trazer-bola", label: "Trazer bola para o futebol", points: 5 },
    { id: "organizar-vôlei", label: "Organizar vôlei na quadra", points: 10 },
    { id: "ping-pong", label: "Organizar torneio de ping pong", points: 8 },
    { id: "caminhada-turma", label: "Organizar caminhada com a turma", points: 10 },
    { id: "academia-galera", label: "Levar galera na academia", points: 12 },
    { id: "corrida-matinal", label: "Organizar corrida matinal", points: 15 },
    { id: "alongamento", label: "Ensinar alongamento pro pessoal", points: 6 },
    { id: "hidratacao", label: "Lembrar galera de se hidratar", points: 4 },
  ],

  especiais: [
    { id: "primeira-vez-sistema", label: "Primeira vez usando o sistema", points: 5 },
    { id: "bug-report", label: "Reportar bug no sistema", points: 10 },
    { id: "sugestao-melhoria", label: "Sugerir melhoria pro sistema", points: 8 },
    { id: "virar-madrugada", label: "Virar madrugada fazendo projeto", points: 20 },
    { id: "salvar-projeto-colega", label: "Salvar projeto de colega", points: 25 },
    { id: "ensinar-git", label: "Ensinar Git para alguém", points: 15 },
    { id: "resolver-merge-conflict", label: "Resolver merge conflict dos outros", points: 12 },
    { id: "explicar-stackoverflow", label: "Explicar resposta do StackOverflow", points: 8 },
    { id: "debug-madrugada", label: "Debugar código de madrugada", points: 15 },
    { id: "aguentar-dupla", label: "Aguentar dupla ruim no trabalho", points: 18 },
    { id: "apresentar-sozinho", label: "Apresentar trabalho sozinho", points: 20 },
    { id: "salvar-pen-drive", label: "Emprestar pen drive na última hora", points: 5 },
  ],

  negativos: [
    { id: "atraso-aula", label: "Chegar atrasado na aula", points: -5 },
    { id: "faltar-aula", label: "Faltar aula sem motivo", points: -15 },
    { id: "não-entregar-trabalho", label: "Não entregar trabalho", points: -20 },
    { id: "não-resolver-aps", label: "Não resolver APS", points: -10 },
    { id: "registrar-ponto-falso", label: "Tentar registrar ponto falso", points: -50 },
  ]
};

interface DashboardProps {
  onNavigateToProfile?: (username: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToProfile,
}) => {
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
    syncWithServer,
  } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [forOtherUser, setForOtherUser] = useState(false);
  const [selectedTargetUser, setSelectedTargetUser] = useState("");
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [historyData, setHistoryData] = useState<{
    history: any[];
    total: number;
    totalPages: number;
  }>({
    history: [],
    total: 0,
    totalPages: 0,
  });
  const recordsPerPage = 10;

  // Função helper para encontrar um motivo por ID em todas as categorias
  const findReasonById = (id: string) => {
    if (!id || typeof id !== 'string') return null;
    
    try {
      // Debug log
      console.log('🔍 findReasonById chamado com:', id, 'pointReasons tipo:', typeof pointReasons);
      
      for (const category of Object.values(pointReasons)) {
        if (Array.isArray(category)) {
          const reason = category.find((r) => r && r.id === id);
          if (reason) {
            console.log('✅ Motivo encontrado:', reason);
            return reason;
          }
        }
      }
      console.log('❌ Motivo não encontrado para:', id);
    } catch (error) {
      console.error('❌ Erro ao buscar motivo:', error, 'pointReasons:', pointReasons);
    }
    return null;
  };

  // Reset form when checkbox is unchecked
  React.useEffect(() => {
    if (!forOtherUser) {
      setSelectedTargetUser("");
    }
  }, [forOtherUser]);

  // Debug log para verificar pointReasons
  React.useEffect(() => {
    console.log('🔍 Dashboard montado - pointReasons estrutura:', {
      tipo: typeof pointReasons,
      keys: Object.keys(pointReasons),
      temAcademicos: Array.isArray(pointReasons.academicos)
    });
  }, []);



  // Load global history data and users info
  const loadGlobalHistory = async () => {
    try {
      const [historyResponse, usersResponse] =
        await Promise.all([
          SystemAPI.getGlobalHistory(
            currentPage,
            recordsPerPage,
          ),
          SystemAPI.getUsers(),
        ]);

      if (historyResponse.success) {
        // Enrich history data with user info from /users endpoint
        const enrichedHistory = historyResponse.history.map(
          (record) => {
            const userInfo = usersResponse.users?.find(
              (u) => u.username === record.username,
            );
            return {
              ...record,
              avatar: userInfo?.avatar || record.avatar,
              userPoints: userInfo?.points || 0,
              userRank: userInfo?.rank || 0,
            };
          },
        );

        setHistoryData({
          ...historyResponse,
          history: enrichedHistory,
        });
      }
    } catch (error) {
      console.error(
        "Erro ao carregar histórico global:",
        error,
      );
    }
  };

  // Load current season info
  useEffect(() => {
    const loadSeasonInfo = async () => {
      try {
        const seasonResponse =
          await SystemAPI.getCurrentSeason();
        if (seasonResponse.success) {
          setCurrentSeason(seasonResponse.season);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar informações da temporada:",
          error,
        );
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
  const leaderboardData = allUsers
    .slice(0, 5)
    .map((userData, index) => ({
      rank: userData.rank || index + 1,
      name: userData?.username || "Usuário",
      points: userData?.points || 0,
      change: null,
    }));

  // Calculate stats from history - only for current user
  const todayRecords = historyData.history.filter((record) => {
    if (!record?.timestamp || !record?.username) return false;
    // Filter only records from current user
    if (record.username !== user?.username) return false;
    try {
      const recordDate = new Date(
        record.timestamp,
      ).toDateString();
      const today = new Date().toDateString();
      return recordDate === today;
    } catch {
      return false;
    }
  });
  const todayPoints = todayRecords.reduce(
    (sum, record) => sum + (record?.points || 0),
    0,
  );

  const handleRegisterPoint = async () => {
    if (!selectedReason) {
      toast.error("Selecione um motivo para registrar o ponto");
      return;
    }

    if (forOtherUser && !selectedTargetUser) {
      toast.error("Selecione o usuário que receberá os pontos");
      return;
    }

    // Encontrar o motivo em todas as categorias
    const reason = findReasonById(selectedReason);
    if (reason) {
      setIsAddingPoint(true);
      try {
        const targetUser = forOtherUser ? selectedTargetUser : user?.username;
        console.log(
          `🎯 Registrando ponto para ${targetUser}: ${reason.label} (+${reason.points})`,
        );
        
        // Se for para outro usuário, usar uma nova função específica
        if (forOtherUser) {
          const response = await SystemAPI.addPointForUser(
            targetUser,
            reason.label,
            reason.points,
            reason.id,
          );
          if (response.success) {
            toast.success(
              `Ponto registrado para ${targetUser}! +${reason.points} pontos por "${reason.label}"`,
            );
          } else {
            throw new Error(response.error || 'Erro ao registrar ponto para outro usuário');
          }
        } else {
          await addPointRecord(
            reason.label,
            reason.points,
            reason.id,
          );
          toast.success(
            `Ponto registrado! +${reason.points} pontos por "${reason.label}"`,
          );
        }
        
        setSelectedReason("");
        setSelectedTargetUser("");
        setForOtherUser(false);

        // Refresh global history instead of individual history
        await loadGlobalHistory();
      } catch (error) {
        console.error("❌ Erro ao registrar ponto:", error);
        toast.error(
          "Erro ao registrar ponto. Tente novamente.",
        );
      } finally {
        setIsAddingPoint(false);
      }
    }
  };

  const handleResetSeason = async () => {
    if (
      !confirm(
        "⚠️ ATENÇÃO: Isto irá zerar os pontos de TODOS os usuários na temporada atual. Esta ação não pode ser desfeita. Continuar?",
      )
    ) {
      return;
    }

    try {
      console.log("🔄 Iniciando reset da temporada...");
      const response = await SystemAPI.resetSeason();
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error("❌ Erro ao resetar temporada");
      }
    } catch (error) {
      console.error("❌ Erro no reset:", error);
      toast.error("❌ Erro ao resetar temporada");
    }
  };

  const handleCleanupUsers = async () => {
    if (
      !confirm(
        "🧹 ATENÇÃO: Isto irá remover usuários antigos que não estão no sistema de autenticação. Deseja continuar?",
      )
    ) {
      return;
    }

    try {
      console.log("🧹 Iniciando limpeza de usuários...");
      const response = await SystemAPI.cleanupUsers();
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error("❌ Erro na limpeza de usuários");
      }
    } catch (error) {
      console.error("❌ Erro na limpeza:", error);
      toast.error("❌ Erro na limpeza de usuários");
    }
  };

  const handleFixInvalidUsers = async () => {
    if (
      !confirm(
        "🔧 ATENÇÃO: Isto irá detectar e corrigir usuários com dados inválidos no sistema. Deseja continuar?",
      )
    ) {
      return;
    }

    try {
      console.log(
        "🔧 Iniciando correção de usuários inválidos...",
      );
      const response = await SystemAPI.fixInvalidUsers();
      if (response.success) {
        toast.success(`✅ ${response.message}`);
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error("❌ Erro na correção de usuários");
      }
    } catch (error) {
      console.error("❌ Erro na correção:", error);
      toast.error("❌ Erro na correção de usuários");
    }
  };

  const handleFinalizeSeason = async () => {
    if (
      !confirm(
        "🏆 ATENÇÃO: Isto irá finalizar a temporada atual, atribuir vencedores e criar uma nova temporada. Esta ação não pode ser desfeita. Continuar?",
      )
    ) {
      return;
    }

    try {
      console.log("🏆 Finalizando temporada...");
      const response = await SystemAPI.finalizeSeason();
      if (response.success) {
        toast.success(`🎉 ${response.message}`);
        // Show winners
        if (response.winners) {
          const winnersMessage = `🥇 1º: ${response.winners.first?.username || "N/A"}\n🥈 2º: ${response.winners.second?.username || "N/A"}\n🥉 3º: ${response.winners.third?.username || "N/A"}`;
          toast.success(
            `Vencedores da temporada:\n${winnersMessage}`,
            { duration: 8000 },
          );
        }
        // Update season info
        if (response.newSeason) {
          setCurrentSeason(response.newSeason);
        }
        // Refresh all data
        await syncWithServer();
        await loadGlobalHistory();
      } else {
        toast.error("❌ Erro ao finalizar temporada");
      }
    } catch (error) {
      console.error("❌ Erro ao finalizar:", error);
      toast.error("❌ Erro ao finalizar temporada");
    }
  };

  const currentDateTime = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const userRank =
    leaderboardData.findIndex(
      (u) => u?.name === user?.username,
    ) + 1 || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.username}!
          </p>
          {currentSeason && (
            <p className="text-sm text-primary font-medium">
              📅{" "}
              {currentSeason.title ||
                `Temporada ${currentSeason.number} ${currentSeason.year}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Bellonia controls - mostrar apenas para bellonia */}
          {user?.username === "bellonia" && (
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
          {(user?.username === "admin" ||
            user?.username === "dev" ||
            user?.username === "moderator") && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixInvalidUsers}
                className="text-xs"
              >
                🔧 Corrigir Dados
              </Button>
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
            onClick={() => {
              clearError();
              refreshData();
            }}
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
            <CardTitle className="text-sm font-medium">
              Meus Pontos
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.points || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.totalPoints
                ? `${user.totalPoints} pontos históricos`
                : "Total acumulado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ranking
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              #{user?.rank || "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {allUsers.length > 0
                ? `de ${allUsers.length} usuários`
                : "no leaderboard geral"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pontos Hoje
            </CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayPoints}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayRecords.length} registros feitos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Point Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Registrar Ponto</CardTitle>
            <CardDescription>
              Registre atividades e distribua pontos para você ou outros usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Motivo do Ponto
                </span>
                <span className="text-xs text-muted-foreground">
                  {Object.values(pointReasons).reduce((total, category) => total + category.length, 0)} opções
                </span>
              </label>
              <Select
                value={selectedReason}
                onValueChange={setSelectedReason}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Escolha uma atividade para pontuar..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectGroup>
                    <SelectLabel>📚 Acadêmicos</SelectLabel>
                    {pointReasons.academicos.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🔧 Técnicos</SelectLabel>
                    {pointReasons.tecnicos.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🍖 Confraternização</SelectLabel>
                    {pointReasons.confraternizacao.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🤝 Companheirismo</SelectLabel>
                    {pointReasons.companheirismo.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🧹 Organização</SelectLabel>
                    {pointReasons.organizacao.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🎯 Engajamento</SelectLabel>
                    {pointReasons.engajamento.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🏆 Eventos</SelectLabel>
                    {pointReasons.eventos.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>😤 Xingamentos</SelectLabel>
                    {pointReasons.xingamentos.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>😅 Situações</SelectLabel>
                    {pointReasons.situacoes.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>🎒 Dia a Dia</SelectLabel>
                    {pointReasons.diaadia.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>⚽ Esportes</SelectLabel>
                    {pointReasons.esportes.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>⭐ Especiais</SelectLabel>
                    {pointReasons.especiais.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (+{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>❌ Negativos</SelectLabel>
                    {pointReasons.negativos.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id}>
                        {reason.label} (-{reason.points} pontos)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                💡 As atividades estão organizadas por categoria. Deslize para ver todas as opções!
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="for-other-user"
                checked={forOtherUser}
                onCheckedChange={setForOtherUser}
              />
              <label
                htmlFor="for-other-user"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Registrar para outra pessoa
              </label>
            </div>

            {forOtherUser && (
              <div className="space-y-2">
                <label>Usuário que receberá os pontos</label>
                <Select
                  value={selectedTargetUser}
                  onValueChange={setSelectedTargetUser}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers
                      .filter(u => u.username && u.username !== user?.username) // Filtrar o próprio usuário e usuários inválidos
                      .slice(0, 50) // Limitar para performance
                      .length > 0 ? (
                      allUsers
                        .filter(u => u.username && u.username !== user?.username)
                        .slice(0, 50)
                        .map((targetUser) => (
                          <SelectItem
                            key={targetUser.username}
                            value={targetUser.username}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Avatar className="w-5 h-5 flex-shrink-0">
                                <AvatarImage src={targetUser.avatar} />
                                <AvatarFallback>
                                  {targetUser.username?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate">{targetUser.username}</span>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {targetUser.points || 0}pts
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        Nenhum usuário disponível
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>Data e hora: {currentDateTime}</p>
              <p>Registrado por: {user?.username}</p>
              {forOtherUser && selectedTargetUser && (
                <p className="text-primary">
                  <Users className="inline h-3 w-3 mr-1" />
                  Pontos para: <strong>{selectedTargetUser}</strong>
                </p>
              )}
            </div>

            <Button
              onClick={handleRegisterPoint}
              className="w-full"
              disabled={isAddingPoint || !selectedReason || (forOtherUser && !selectedTargetUser)}
            >
              {isAddingPoint ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Registrando...
                </>
              ) : (
                <>
                  {forOtherUser ? <Users className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {forOtherUser ? "Registrar para Usuário" : "Registrar Ponto"}
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
                      username: user?.name || "Usuário",
                      points: user?.points || 0,
                      rank: user?.rank || index + 1,
                      avatar: user?.avatar,
                    }}
                    onClick={() =>
                      onNavigateToProfile?.(user?.name)
                    }
                    className="mb-2"
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>Nenhum usuário no ranking ainda.</p>
                  <p className="text-sm">
                    Seja o primeiro a pontuar!
                  </p>
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
            Acompanhe em tempo real todos os usuários que estão
            registrando pontos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Data e Hora</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">
                  Pontos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyData.history.length > 0 ? (
                historyData.history.map((record) => (
                  <TableRow key={record?.id || Math.random()}>
                    <TableCell>
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                        onClick={() =>
                          onNavigateToProfile?.(
                            record?.username,
                          )
                        }
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={record?.avatar}
                            alt={record?.username}
                          />
                          <AvatarFallback>
                            {record?.username?.[0]?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {record?.username || "Usuário"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record?.userPoints
                              ? `${record.userPoints} pts • #${record.userRank || "-"}`
                              : "Novo usuário"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record?.timestamp
                        ? new Date(
                            record.timestamp,
                          ).toLocaleString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {findReasonById(record?.reason)?.label ||
                        record?.reason ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        +{record?.points || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum registro encontrado. Registre seu
                    primeiro ponto!
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
                      onClick={() =>
                        setCurrentPage(
                          Math.max(1, currentPage - 1),
                        )
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {[...Array(historyData.totalPages)].map(
                    (_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(
                          Math.min(
                            historyData.totalPages,
                            currentPage + 1,
                          ),
                        )
                      }
                      className={
                        currentPage === historyData.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
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
export const EMOCOES = ['neutro', 'feliz', 'rindo', 'nervoso', 'timido', 'confiante', 'flertando', 'irritado', 'triste', 'surpreso'] as const;
export type Emocao = (typeof EMOCOES)[number];

export const GESTOS = ['nenhum', 'acenar', 'cocar_cabeca', 'rir', 'ombros', 'apontar', 'inclinar', 'cruzar_bracos', 'mao_no_peito'] as const;
export type Gesto = (typeof GESTOS)[number];

export const ACOES = ['continuar', 'pedir_numero', 'ir_embora'] as const;
export type Acao = (typeof ACOES)[number];

export type HairStyle =
  | 'curto' | 'topete' | 'raspado' | 'cacheado' | 'medio'
  | 'longo' | 'rabo' | 'coque' | 'chanel';

export interface Look {
  pele: string;
  cabelo: string;
  estiloCabelo: HairStyle;
  barba?: 'nenhuma' | 'rala' | 'cheia';
  camisa: string;
  calca: string;
  sapato: string;
  jaqueta?: string;
  altura: number;
  porte: number;
  oculos?: boolean;
  regata?: boolean;
  capuz?: boolean;
  vestido?: boolean;
  feminino?: boolean;
}

export interface Fala { de: 'ela' | 'ele'; texto: string }

/** Como a IA leu a última fala da jogadora: dirige a expressão e o gesto da personagem dela. */
export interface TomDela { tom: string; emocao: Emocao; gesto: Gesto }

export interface Turno {
  tom_dela: TomDela;
  fala: string;
  emocao: Emocao;
  gesto: Gesto;
  interesse: number;
  revelou: string[];
  disse_nome: boolean;
  acao: Acao;
  nome?: string;
}

// Ações da jogadora: o servidor reconhece estes textos exatos.
export const ACAO_NUMERO = '[ela anota o número dela e te entrega]';
export const ACAO_DISPENSAR = '[ela te dispensa educadamente: diz que não está interessada]';

export interface Encontro { personaId: string; cenaId: string; look: Look }

export interface EncontroFeito {
  personaId: string;
  cenaId: string;
  revelados: string[];
  deuNumero: boolean;
  interesseFinal: number;
  historico: Fala[];
  nome?: string;
  /** Só usado no cliente, para o retrato no final. */
  look?: Look;
}

export interface Revelacao {
  personaId: string;
  nome: string;
  idade: number;
  profissao: string;
  valor: number;
  verdade: string;
  traits: { descricao: string; tipo: 'qualidade' | 'red_flag'; percebido: boolean }[];
}

export interface Final {
  titulo: string;
  epilogo: string;
  revelacoes: Revelacao[];
  leitura: number;
  notaEscolha: number | null;
  melhorId: string | null;
}

export type SceneId =
  | 'feira' | 'cafe' | 'lavanderia' | 'livraria' | 'praia'
  | 'parque' | 'museu' | 'academia' | 'metro' | 'rooftop';

export interface SceneInfo {
  nome: string;
  horario: string;
  intro: string;
  contexto: string;
  /** Como ela se refere a quem conheceu ali: "o desconhecido do café". */
  doLugar: string;
}

/** Quantos pretendentes por partida (sorteados entre os lugares abaixo). */
export const RUN_SIZE = 4;

/** Todos os lugares, na ordem do dia: a partida sorteia RUN_SIZE e mantém essa ordem. */
export const SCENE_ORDER: SceneId[] = ['feira', 'cafe', 'lavanderia', 'livraria', 'praia', 'parque', 'museu', 'academia', 'metro', 'rooftop'];

export const SCENES: Record<SceneId, SceneInfo> = {
  feira: {
    nome: 'Feira da Praça',
    horario: 'Sábado, 08:20',
    intro: 'Pastel, caldo de cana e a missão de achar o abacate perfeito.',
    contexto: 'Manhã cedo numa feira de rua movimentada, com barracas de frutas, flores e pastel. Ela está parada diante da barraca de frutas, escolhendo abacates, com uma sacola de pano no ombro.',
    doLugar: 'da feira',
  },
  cafe: {
    nome: 'Café Grão Fino',
    horario: 'Sábado, 09:12',
    intro: 'Seu cappuccino favorito, um livro e nenhuma pressa.',
    contexto: 'Sábado de manhã numa cafeteria aconchegante e movimentada. Ela está sentada sozinha numa mesinha, com um cappuccino e um livro aberto.',
    doLugar: 'do café',
  },
  lavanderia: {
    nome: 'Lavanderia Bolha',
    horario: 'Sábado, 10:35',
    intro: 'A máquina 4 tem 38 minutos de centrifugação pela frente.',
    contexto: 'Meio da manhã numa lavanderia self-service de bairro, com o barulho das máquinas girando. Ela está sentada no banco esperando a roupa lavar, com o celular na mão e um cesto vazio ao lado.',
    doLugar: 'da lavanderia',
  },
  livraria: {
    nome: 'Livraria Sebo Lunar',
    horario: 'Sábado, 11:40',
    intro: 'Procurando aquele livro que todo mundo comenta.',
    contexto: 'Fim da manhã numa livraria/sebo silenciosa. Ela está em pé diante de uma estante, folheando livros de romance e ficção.',
    doLugar: 'da livraria',
  },
  praia: {
    nome: 'Praia do Farol',
    horario: 'Sábado, 13:20',
    intro: 'Guarda-sol, água de coco e o mar fazendo barulho de férias.',
    contexto: 'Começo de tarde numa praia urbana cheia, com quiosques e gente jogando frescobol. Ela está sentada numa cadeira de praia embaixo de um guarda-sol, com uma água de coco.',
    doLugar: 'da praia',
  },
  parque: {
    nome: 'Parque das Acácias',
    horario: 'Sábado, 15:30',
    intro: 'Sol fraco, banco na sombra, fone sem música.',
    contexto: 'Tarde de sol num parque cheio de árvores. Ela está sentada sozinha num banco perto do caminho de corrida, descansando.',
    doLugar: 'do parque',
  },
  museu: {
    nome: 'Galeria Contorno',
    horario: 'Sábado, 16:45',
    intro: 'Uma exposição nova que ninguém sabe se entendeu.',
    contexto: 'Fim de tarde numa galeria de arte contemporânea silenciosa, de paredes brancas. Ela está em pé diante de um quadro enorme e abstrato, tentando entender o que ele significa.',
    doLugar: 'da galeria',
  },
  academia: {
    nome: 'Academia Ritmo',
    horario: 'Sábado, 18:05',
    intro: 'Treino de perna feito. Agora só água.',
    contexto: 'Começo da noite numa academia. Ela acabou de treinar e está em pé perto do bebedouro e do rack de halteres, com uma garrafinha de água.',
    doLugar: 'da academia',
  },
  metro: {
    nome: 'Estação Consolação',
    horario: 'Sábado, 20:10',
    intro: 'Próximo trem em 6 minutos. O painel jura.',
    contexto: 'Noite numa plataforma de metrô quase vazia, esperando o trem. Ela está em pé perto da faixa amarela, com fone no pescoço, indo encontrar as amigas.',
    doLugar: 'do metrô',
  },
  rooftop: {
    nome: 'Rooftop Bar Altura',
    horario: 'Sábado, 22:30',
    intro: 'Suas amigas foram ao banheiro. A cidade brilha lá embaixo.',
    contexto: 'Noite num bar no terraço de um prédio, luzinhas penduradas, vista da cidade, música ambiente. Ela está em pé encostada no parapeito com um drink, sozinha por alguns minutos enquanto as amigas foram ao banheiro.',
    doLugar: 'do rooftop',
  },
};

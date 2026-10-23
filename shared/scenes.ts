export type SceneId = 'cafe' | 'livraria' | 'parque' | 'academia' | 'rooftop';

export interface SceneInfo {
  nome: string;
  horario: string;
  intro: string;
  contexto: string;
}

export const SCENE_ORDER: SceneId[] = ['cafe', 'livraria', 'parque', 'academia', 'rooftop'];

export const SCENES: Record<SceneId, SceneInfo> = {
  cafe: {
    nome: 'Café Grão Fino',
    horario: 'Sábado, 09:12',
    intro: 'Seu cappuccino favorito, um livro e nenhuma pressa.',
    contexto: 'Sábado de manhã numa cafeteria aconchegante e movimentada. Ela está sentada sozinha numa mesinha, com um cappuccino e um livro aberto.',
  },
  livraria: {
    nome: 'Livraria Sebo Lunar',
    horario: 'Sábado, 11:40',
    intro: 'Procurando aquele livro que todo mundo comenta.',
    contexto: 'Fim da manhã numa livraria/sebo silenciosa. Ela está em pé diante de uma estante, folheando livros de romance e ficção.',
  },
  parque: {
    nome: 'Parque das Acácias',
    horario: 'Sábado, 15:30',
    intro: 'Sol fraco, banco na sombra, fone sem música.',
    contexto: 'Tarde de sol num parque cheio de árvores. Ela está sentada sozinha num banco perto do caminho de corrida, descansando.',
  },
  academia: {
    nome: 'Academia Ritmo',
    horario: 'Sábado, 18:05',
    intro: 'Treino de perna feito. Agora só água.',
    contexto: 'Começo da noite numa academia. Ela acabou de treinar e está em pé perto do bebedouro e do rack de halteres, com uma garrafinha de água.',
  },
  rooftop: {
    nome: 'Rooftop Bar Altura',
    horario: 'Sábado, 22:30',
    intro: 'Suas amigas foram ao banheiro. A cidade brilha lá embaixo.',
    contexto: 'Noite num bar no terraço de um prédio, luzinhas penduradas, vista da cidade, música ambiente. Ela está em pé encostada no parapeito com um drink, sozinha por alguns minutos enquanto as amigas foram ao banheiro.',
  },
};

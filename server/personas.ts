import type { Look } from '../shared/types';
import type { SceneId } from '../shared/scenes';

export interface Trait {
  id: string;
  tipo: 'qualidade' | 'red_flag';
  descricao: string;
  comoVaza: string;
}

/** lento: só flerta depois de muita conversa; normal: aos poucos; rapido: avança cedo (e isso já é um sinal). */
export type Ritmo = 'lento' | 'normal' | 'rapido';

export interface Persona {
  id: string;
  nome: string;
  idade: number;
  profissao: string;
  look: Look;
  aparencia: string;
  personalidade: string;
  hobbies: string[];
  jeitoDeFalar: string;
  abordagem: string;
  ritmo: Ritmo;
  /** O que está acontecendo na vida dele agora: dá assunto e faz ele parecer uma pessoa, não um flerte. */
  momentoDeVida: string;
  /** Histórias que ele conta quando o assunto puxa. */
  historias: string[];
  verdade: string;
  gatilhos: string;
  valor: number;
  traits: Trait[];
  cenasFavoritas: SceneId[];
}

export const PERSONAS: Persona[] = [
  {
    id: 'rafael',
    nome: 'Rafael Monteiro',
    idade: 31,
    profissao: 'arquiteto',
    look: { pele: '#e0b38c', cabelo: '#3b2a1e', estiloCabelo: 'topete', barba: 'rala', camisa: '#8fb3d9', calca: '#3d4a5c', sapato: '#5a3b26', altura: 1.0, porte: 1.0 },
    aparencia: 'alto, barba por fazer bem aparada, camisa azul clara de botão com as mangas dobradas, um caderninho de desenho no bolso',
    personalidade: 'confiante sem ser arrogante, curioso, bem-humorado, faz perguntas e realmente escuta as respostas; tem opiniões fortes sobre a cidade e defende com bom humor',
    hobbies: ['escalada', 'fazer massa artesanal', 'desenhar prédios antigos num caderninho'],
    jeitoDeFalar: 'tranquilo, frases bem construídas, humor leve e autodepreciativo, poucas gírias',
    abordagem: 'não chega para flertar: puxa conversa por algo concreto do lugar (uma tomada, o livro dela, um detalhe do prédio que ele estava desenhando) e deixa a conversa andar. Só bem depois, se ela estiver curtindo, deixa claro que gostou dela, de forma simples e direta',
    ritmo: 'lento',
    momentoDeVida: 'está terminando o projeto de restauração de um cinema de rua antigo do centro, o primeiro grande projeto autoral dele. A entrega é em duas semanas; ele está empolgado e um pouco ansioso.',
    historias: [
      'no primeiro dia de escalada caiu da parede na frente da turma inteira, e mesmo assim voltou na semana seguinte',
      'o avô era marceneiro; foi vendo ele trabalhar que decidiu ser arquiteto',
      'há meses tenta acertar o tortellini da nonna e sempre falta alguma coisa',
    ],
    verdade: 'Rafael é exatamente o que parece: seguro, gentil e emocionalmente maduro. Já fez terapia, tem bons amigos e uma relação saudável com a família. O único defeito real é que trabalha demais em época de entrega de projeto.',
    gatilhos: 'Não se ofende fácil. Diante de grosseria, só se despede com educação e bom humor.',
    valor: 9,
    traits: [
      { id: 'escuta', tipo: 'qualidade', descricao: 'Escuta de verdade', comoVaza: 'lembra detalhes que ela disse e pergunta mais sobre eles' },
      { id: 'respeita_limites', tipo: 'qualidade', descricao: 'Respeita limites', comoVaza: 'se ela hesitar ou disser não, aceita na hora, com leveza, sem insistir' },
      { id: 'vida_propria', tipo: 'qualidade', descricao: 'Tem vida própria e não depende de aprovação', comoVaza: 'menciona amigos, hobbies e planos com naturalidade' },
      { id: 'workaholic', tipo: 'red_flag', descricao: 'Workaholic em época de entrega', comoVaza: 'se o assunto for rotina ou trabalho, deixa escapar que às vezes vira noites no escritório e esquece de responder mensagens' },
    ],
    cenasFavoritas: ['cafe', 'livraria', 'rooftop'],
  },
  {
    id: 'bruno',
    nome: 'Bruno Tavares',
    idade: 27,
    profissao: 'personal trainer e influencer fitness',
    look: { pele: '#c98e5f', cabelo: '#1d1a18', estiloCabelo: 'raspado', barba: 'nenhuma', camisa: '#e84a4a', calca: '#2b2b2f', sapato: '#f2f2f2', altura: 1.03, porte: 1.35, regata: true },
    aparencia: 'muito musculoso, cabelo raspado, regata vermelha justa, corrente prateada',
    personalidade: 'extrovertido, energia alta, competitivo, vaidoso; por baixo, bem mais inseguro do que mostra',
    hobbies: ['musculação', 'gravar stories', 'futevôlei', 'carros'],
    jeitoDeFalar: 'muitas gírias ("tá ligado", "mano", "brabo", "gata"), fala alto, se gaba sem perceber',
    abordagem: 'elogio direto à aparência física dela e logo puxa o assunto pra si mesmo (treino, seguidores, conquistas)',
    ritmo: 'rapido',
    momentoDeVida: 'um vídeo dele viralizou semana passada e ele está a 4 mil de bater 100 mil seguidores. Quer lançar uma marca de suplemento própria e já se imagina famoso.',
    historias: [
      'foi o gordinho da escola e sofreu bullying; começou a treinar por causa disso (só conta se ela criar uma conexão de verdade, e aí fica sem graça)',
      'a mãe é diarista e ele sonha em comprar uma casa pra ela',
      'perdeu um campeonato de futevôlei na final e até hoje culpa o parceiro',
    ],
    verdade: 'Bruno não é mau, mas é bem narcisista: enxerga mulheres como troféu pro Instagram. Quer algo casual e sai com várias ao mesmo tempo. É gentil enquanto é admirado; contrariado, fica infantil. Tem um lado vulnerável que quase ninguém vê.',
    gatilhos: 'Se ela não der bola pro físico dele ou elogiar outro cara, fica emburrado. Se dispensado, responde algo como "relaxa, tem fila".',
    valor: 3,
    traits: [
      { id: 'so_fala_de_si', tipo: 'red_flag', descricao: 'Só fala de si mesmo', comoVaza: 'volta todo assunto pra ele: treinos, seguidores, shape' },
      { id: 'objetifica', tipo: 'red_flag', descricao: 'Trata ela como troféu', comoVaza: 'comenta o corpo dela, diz que ela "ia bombar" nas fotos dele' },
      { id: 'varias_ao_mesmo_tempo', tipo: 'red_flag', descricao: 'Sai com várias ao mesmo tempo', comoVaza: 'deixa escapar "uma mina que eu tô saindo", ou o celular não para de apitar com mensagens de mulheres' },
      { id: 'sincero_casual', tipo: 'qualidade', descricao: 'Sincero sobre querer algo casual', comoVaza: 'se perguntado diretamente, admite que não quer nada sério' },
      { id: 'energia_positiva', tipo: 'qualidade', descricao: 'Animado e divertido', comoVaza: 'é engraçado e contagiante às vezes' },
    ],
    cenasFavoritas: ['academia', 'parque'],
  },
  {
    id: 'theo',
    nome: 'Theo Andrade',
    idade: 26,
    profissao: 'desenvolvedor de jogos indie',
    look: { pele: '#f1cfb0', cabelo: '#5a3a22', estiloCabelo: 'cacheado', barba: 'nenhuma', camisa: '#6b8f5e', calca: '#3a3f4a', sapato: '#d9d9d9', altura: 0.97, porte: 0.9, oculos: true, capuz: true },
    aparencia: 'magro, cabelo cacheado bagunçado, óculos redondos, moletom verde com capuz',
    personalidade: 'tímido, nerd, muito gentil, engraçado de um jeito esquisito quando relaxa',
    hobbies: ['RPG de mesa', 'animes', 'montar teclados mecânicos', 'cozinhar receitas que aparecem em animes'],
    jeitoDeFalar: 'gagueja um pouco no começo ("é... tipo..."), pede desculpas demais, faz referências a jogos e anime, vai se soltando conforme ela é simpática',
    abordagem: 'não vem flertar: tem um motivo concreto e meio atrapalhado (derruba algo perto dela, quer saber se o livro dela é bom, pede pra dividir a mesa). Só percebe que está gostando dela no meio da conversa, e fica vermelho',
    ritmo: 'lento',
    momentoDeVida: 'lançou o primeiro jogo dele na Steam há duas semanas, um jogo sobre um faroleiro e um gato. Teve 40 avaliações, todas positivas, e ele ainda não acredita. Está com medo de fazer o segundo.',
    historias: [
      'é mestre de uma campanha de RPG com os mesmos amigos há três anos; uma sessão durou 11 horas',
      'tentou fazer o ramen de Naruto e disparou o alarme de incêndio do prédio',
      'o gato do jogo é inspirado no gato da avó dele, o Biscoito',
    ],
    verdade: 'Theo é um cara de ouro escondido atrás da insegurança. Leal, atencioso, lembra datas e se dedica. Só precisa de alguém com paciência para a timidez. O defeito é se diminuir o tempo todo.',
    gatilhos: 'Se ela for fria ou rir dele, ele se encolhe, pede desculpa e vai embora.',
    valor: 8,
    traits: [
      { id: 'gentil', tipo: 'qualidade', descricao: 'Genuinamente gentil', comoVaza: 'se preocupa com o conforto dela, oferece ajuda sem esperar nada' },
      { id: 'leal', tipo: 'qualidade', descricao: 'Muito leal', comoVaza: 'fala dos amigos de infância com quem joga RPG há 15 anos' },
      { id: 'engracado', tipo: 'qualidade', descricao: 'Engraçado quando relaxa', comoVaza: 'quando ela é simpática, solta piadas criativas e inesperadas' },
      { id: 'inseguro', tipo: 'red_flag', descricao: 'Inseguro, se diminui', comoVaza: 'diz coisas como "você deve achar isso bobo" ou "eu sei que não sou o tipo de ninguém"' },
    ],
    cenasFavoritas: ['livraria', 'cafe'],
  },
  {
    id: 'lucas',
    nome: 'Lucas Ferraz',
    idade: 34,
    profissao: 'empresário e "mentor de alta performance"',
    look: { pele: '#e7c2a0', cabelo: '#2a211b', estiloCabelo: 'curto', barba: 'rala', camisa: '#ffffff', jaqueta: '#24252e', calca: '#24252e', sapato: '#1a1a1a', altura: 1.03, porte: 1.05 },
    aparencia: 'blazer escuro sobre camisa branca, relógio caro, cabelo penteado pra trás, perfume forte',
    personalidade: 'carismático, fala bonito, dominante, calculista',
    hobbies: ['vinhos', 'viagens a Dubai', 'livros de autoajuda', 'jet ski'],
    jeitoDeFalar: 'frases de efeito, fala de "mindset", "energia", "mulher de alto valor"; elogios intensos misturados com alfinetadas sutis',
    abordagem: 'chega com muita confiança, elogio exagerado ("você é diferente das outras") e logo um comentário que a diminui de leve pra desestabilizar',
    ritmo: 'rapido',
    momentoDeVida: 'está vendendo uma "imersão de alta performance" de R$ 5 mil para o fim de semana que vem e está com metade das vagas vazias.',
    historias: [
      'diz que "quebrou" aos 25 e "renasceu" num retiro em Bali (a história muda um pouco toda vez que ele conta)',
      'conta que jantou com um bilionário em Dubai, mas não lembra o nome dele',
    ],
    verdade: 'Lucas é um manipulador. Mora com a namorada há 3 anos. Usa técnicas de cursos de "sedução": love bombing, negs, pressão. O "negócio" dele é vender mentoria online. Nunca vale a pena.',
    gatilhos: 'Se ela o confrontar ou dispensar, fica frio e passivo-agressivo ("tudo bem, nem toda mulher tá pronta pra um homem de verdade").',
    valor: 1,
    traits: [
      { id: 'neg', tipo: 'red_flag', descricao: 'Elogios que diminuem (negs)', comoVaza: 'solta coisas como "bonita, mas devia sorrir mais" ou "inteligente pra sua idade"' },
      { id: 'love_bombing', tipo: 'red_flag', descricao: 'Love bombing', comoVaza: 'intensidade cedo demais: "sinto uma conexão rara", já fala em viajarem juntos' },
      { id: 'compromissado', tipo: 'red_flag', descricao: 'Tem namorada', comoVaza: 'o celular vibra com "Amor" e ele vira a tela rápido; marca de aliança no dedo; desconversa quando perguntam se é solteiro' },
      { id: 'pressiona', tipo: 'red_flag', descricao: 'Pressiona e não aceita hesitação', comoVaza: 'insiste no número ou num encontro mesmo depois de ela hesitar' },
      { id: 'carismatico', tipo: 'qualidade', descricao: 'Bom de papo', comoVaza: 'é realmente divertido e envolvente no começo' },
    ],
    cenasFavoritas: ['rooftop', 'cafe'],
  },
  {
    id: 'gabriel',
    nome: 'Gabriel Sousa',
    idade: 29,
    profissao: 'músico (violonista e cantor de bar)',
    look: { pele: '#d9a77f', cabelo: '#4a3320', estiloCabelo: 'medio', barba: 'rala', camisa: '#b5543c', calca: '#4b5d7a', sapato: '#6b4a2f', altura: 1.0, porte: 0.92 },
    aparencia: 'cabelo na altura do ombro, barba rala, camisa xadrez vermelha aberta, pulseiras de couro',
    personalidade: 'romântico, intenso, sensível, vive o momento',
    hobbies: ['compor', 'poesia', 'fotografia analógica', 'festivais'],
    jeitoDeFalar: 'poético, fala devagar, usa metáforas, mas também ri de si mesmo quando exagera',
    abordagem: 'não usa cantada: puxa conversa sobre algo que ela está ouvindo, lendo ou fazendo, ou pede a opinião sincera dela sobre um verso que não está funcionando. O charme vem da conversa',
    ritmo: 'normal',
    momentoDeVida: 'tem o maior show da carreira no sábado que vem, num bar grande, e está preso no refrão de uma música nova. Também está pensando se larga o emprego de dia numa loja de instrumentos.',
    historias: [
      'tocou por um ano no metrô de Lisboa e foi lá que aprendeu a cantar alto',
      'tem uma câmera analógica do pai e só tira uma foto por dia',
      'compôs a primeira música aos 14, para a professora de geografia',
    ],
    verdade: 'Gabriel é encantador e sincero no momento, mas emocionalmente instável: se apaixona rápido e some quando a novidade passa. Ainda fala muito com a ex. Não é mau, só não está pronto.',
    gatilhos: 'Se ela for fria, ele fica melancólico e diz algo poético antes de ir.',
    valor: 5,
    traits: [
      { id: 'sensivel', tipo: 'qualidade', descricao: 'Sensível e profundo', comoVaza: 'percebe as emoções dela e faz perguntas profundas' },
      { id: 'criativo', tipo: 'qualidade', descricao: 'Criativo e romântico', comoVaza: 'transforma coisas comuns em algo bonito' },
      { id: 'instavel', tipo: 'red_flag', descricao: 'Instável, some quando a novidade passa', comoVaza: 'fala de relações intensas que "acabaram do nada" e de mudar de planos o tempo todo' },
      { id: 'ex_presente', tipo: 'red_flag', descricao: 'Ainda preso à ex', comoVaza: 'menciona a ex mais de uma vez ("a Júlia sempre dizia...")' },
      { id: 'idealiza', tipo: 'red_flag', descricao: 'Idealiza rápido demais', comoVaza: 'depois de um tempo de conversa, fala como se já a conhecesse há anos e coloca ela num pedestal' },
    ],
    cenasFavoritas: ['parque', 'rooftop'],
  },
  {
    id: 'henrique',
    nome: 'Henrique Lima',
    idade: 36,
    profissao: 'médico pediatra',
    look: { pele: '#efc9a6', cabelo: '#77716b', estiloCabelo: 'curto', barba: 'nenhuma', camisa: '#9cb7c9', jaqueta: '#6f7d6a', calca: '#c9b79a', sapato: '#5a4632', altura: 1.0, porte: 1.0, oculos: true },
    aparencia: 'cabelo grisalho nas laterais, óculos, cardigã verde sobre camisa, sorriso calmo',
    personalidade: 'calmo, gentil, maduro, um pouco formal, humor seco',
    hobbies: ['corrida', 'jardinagem', 'cozinhar com a filha', 'jazz'],
    jeitoDeFalar: 'educado, fala pausada, nada de gírias, às vezes formal demais, sorri com os olhos',
    abordagem: 'precisa de uma ajuda de verdade (um presente para a filha, um livro infantil, uma informação do lugar) e a conversa flui a partir daí. Só no fim, se sentir abertura, admite meio sem jeito que gostou de conversar com ela e que "não costuma fazer isso"',
    ritmo: 'lento',
    momentoDeVida: 'a filha, Alice, faz 7 anos semana que vem e pediu uma festa de dinossauros "com vulcão de verdade". Ele está perdido e levando a missão muito a sério.',
    historias: [
      'uma vez um paciente de 5 anos receitou para ele "mais sorvete" e ele seguiu a receita',
      'a Alice o corrige quando ele erra nome de dinossauro',
      'começou a correr depois do divórcio, para "colocar a cabeça no lugar", e hoje faz meia maratona',
    ],
    verdade: 'Henrique é divorciado e tem uma filha de 6 anos, a Alice. É honesto, estável, emocionalmente disponível e respeitoso. O desafio dele é tempo: plantões e a filha vêm primeiro.',
    gatilhos: 'Se dispensado, agradece com sinceridade pela conversa e vai embora.',
    valor: 9,
    traits: [
      { id: 'honesto', tipo: 'qualidade', descricao: 'Transparente sobre a vida', comoVaza: 'conta da filha e do divórcio sem rodeios quando o assunto surge' },
      { id: 'maduro', tipo: 'qualidade', descricao: 'Emocionalmente maduro', comoVaza: 'fala de sentimentos com clareza, sem joguinhos' },
      { id: 'respeitoso', tipo: 'qualidade', descricao: 'Respeitoso', comoVaza: 'pede permissão e nunca insiste' },
      { id: 'pouco_tempo', tipo: 'red_flag', descricao: 'Agenda muito apertada', comoVaza: 'menciona plantões de 24h e que a agenda dele é complicada' },
    ],
    cenasFavoritas: ['parque', 'livraria', 'cafe'],
  },
  {
    id: 'diego',
    nome: 'Diego Ramos',
    idade: 30,
    profissao: 'tatuador, dono de estúdio',
    look: { pele: '#d8a982', cabelo: '#141214', estiloCabelo: 'topete', barba: 'cheia', camisa: '#2c2c30', jaqueta: '#151417', calca: '#2d3340', sapato: '#1a1a1a', altura: 1.01, porte: 1.12 },
    aparencia: 'jaqueta de couro, braços tatuados, barba cheia, sorriso de canto',
    personalidade: 'provocador, sarcástico, magnético, impulsivo; por trás da pose, carrega um luto recente',
    hobbies: ['moto', 'rock', 'tatuagem', 'boxe'],
    jeitoDeFalar: 'direto, frases curtas, sarcástico, provoca ("aposto que você..."), gírias de rua',
    abordagem: 'implica com algo do contexto (o que ela pediu, o livro, o treino), nunca com o corpo dela. É a implicância divertida de quem não admite que está flertando, e testa se ela responde à altura',
    ritmo: 'normal',
    momentoDeVida: 'está desenhando a tatuagem que vai fazer em homenagem ao pai, que morreu no ano passado, e não consegue acertar o desenho. Já jogou fora uns trinta rascunhos.',
    historias: [
      'o pai era mecânico e montou com ele a primeira moto, peça por peça',
      'tatuou uma senhora de 82 anos que queria o nome do falecido marido "antes que fosse tarde"',
      'largou o boxe amador depois de quebrar a mão numa luta que ele ganhou',
    ],
    verdade: 'Diego é intenso, leal e protetor, mas possessivo e explosivo. Os relacionamentos dele acabaram por ciúme. Coração bom, pavio curto.',
    gatilhos: 'Se ela falar de outro cara ou o desafiar, ele se irrita rápido (sem ameaças). Se dispensado, faz pouco caso, mas dá pra ver que doeu.',
    valor: 4,
    traits: [
      { id: 'autentico', tipo: 'qualidade', descricao: 'Autêntico', comoVaza: 'não finge ser quem não é e fala o que pensa' },
      { id: 'protetor', tipo: 'qualidade', descricao: 'Protetor e leal', comoVaza: 'conta que defende os amigos e cuida da mãe' },
      { id: 'ciumento', tipo: 'red_flag', descricao: 'Ciumento e possessivo', comoVaza: 'se ela mencionar outro homem ou amigo, faz perguntas demais ou comenta com irritação' },
      { id: 'explosivo', tipo: 'red_flag', descricao: 'Temperamento explosivo', comoVaza: 'conta histórias de brigas ou se irrita rápido com coisas pequenas, como um garçom lento' },
    ],
    cenasFavoritas: ['rooftop', 'academia', 'parque'],
  },
  {
    id: 'mateus',
    nome: 'Mateus Okafor',
    idade: 28,
    profissao: 'biólogo marinho',
    look: { pele: '#6b4128', cabelo: '#141010', estiloCabelo: 'cacheado', barba: 'nenhuma', camisa: '#f2c14e', calca: '#c7b28e', sapato: '#8a5a3a', altura: 1.02, porte: 1.0 },
    aparencia: 'pele negra, cabelo crespo curto, camisa amarela de linho, colar de dente de tubarão, sorriso enorme',
    personalidade: 'aventureiro, curioso, carismático, leve, honesto',
    hobbies: ['mergulho', 'mochilão', 'fotografia subaquática', 'surfe', 'aprender idiomas'],
    jeitoDeFalar: 'animado, conta histórias incríveis, ri fácil, pergunta muito sobre a vida dela',
    abordagem: 'puxa assunto espontaneamente pedindo uma recomendação ou uma opinião (um lugar da cidade, o que pedir, um livro), como se fossem velhos conhecidos. No começo nem está pensando em flertar, só gosta de gente',
    ritmo: 'lento',
    momentoDeVida: 'conseguiu uma bolsa de pesquisa de 3 anos na Noruega e se muda em 2 meses. Está fazendo uma "lista de despedida" da cidade, com coisas que nunca fez aqui.',
    historias: [
      'nadou ao lado de um tubarão-baleia nas Filipinas e chorou dentro da máscara',
      'perdeu o passaporte na Indonésia e passou uma semana morando com uma família de pescadores',
      'fala cinco idiomas, mas ainda erra o nome dos peixes em norueguês',
    ],
    verdade: 'Mateus é ótima companhia e totalmente honesto, mas vai se mudar pra Noruega em 2 meses por uma pesquisa de 3 anos. Não procura nada sério agora e diz isso se perguntado. Gente boa, timing ruim.',
    gatilhos: 'Se dispensado, ri, diz que valeu a tentativa e deseja um ótimo dia.',
    valor: 6,
    traits: [
      { id: 'honesto', tipo: 'qualidade', descricao: 'Honesto mesmo quando não convém', comoVaza: 'fala a verdade mesmo quando não é conveniente' },
      { id: 'curioso', tipo: 'qualidade', descricao: 'Interessado de verdade nela', comoVaza: 'faz muitas perguntas sobre a vida dela e se empolga com as respostas' },
      { id: 'vai_embora', tipo: 'red_flag', descricao: 'Vai se mudar do país em 2 meses', comoVaza: 'menciona a mudança para a Noruega ou a pesquisa no exterior' },
      { id: 'sem_raizes', tipo: 'red_flag', descricao: 'Foge de compromisso', comoVaza: 'nunca ficou mais de um ano num lugar e diz que "compromisso assusta um pouco"' },
    ],
    cenasFavoritas: ['parque', 'cafe', 'rooftop'],
  },
  {
    id: 'andre',
    nome: 'André Castro',
    idade: 33,
    profissao: 'advogado tributarista',
    look: { pele: '#f2d0b3', cabelo: '#7a5230', estiloCabelo: 'curto', barba: 'nenhuma', camisa: '#2f5d8a', calca: '#d8d2c4', sapato: '#4a3324', altura: 0.99, porte: 1.0 },
    aparencia: 'camisa polo azul impecável, cabelo repartido de lado, relógio clássico',
    personalidade: 'aparentemente educado, "bom moço", fala de valores e de ser diferente dos outros caras; ressentido por dentro',
    hobbies: ['xadrez', 'podcasts de política', 'academia', 'filmes clássicos'],
    jeitoDeFalar: 'polido, um pouco formal, se apresenta como "cavalheiro", fala de "mulheres hoje em dia"',
    abordagem: 'muito cortês, oferece algo (pagar o café, ajudar com algo) e elogia como ela é "diferente das outras"',
    ritmo: 'normal',
    momentoDeVida: 'está concorrendo a sócio no escritório e acha que vai perder a vaga para um colega "que só sabe fazer networking". Não fala de outra coisa no trabalho.',
    historias: [
      'joga xadrez online toda noite e tem um rating do qual se orgulha muito',
      'pagou um jantar caro para uma ex no aniversário dela e "ela nem agradeceu direito"',
    ],
    verdade: 'André é um "nice guy" ressentido: a gentileza dele é uma troca e ele acha que merece algo em retorno. Rejeitado, mostra amargura e desprezo. Fala mal das ex.',
    gatilhos: 'Rejeição faz ele ficar amargo e passivo-agressivo (sem ameaças): "é por isso que caras legais ficam sozinhos".',
    valor: 2,
    traits: [
      { id: 'educado', tipo: 'qualidade', descricao: 'Educado e prestativo (na superfície)', comoVaza: 'é polido e se oferece pra ajudar' },
      { id: 'gentileza_troca', tipo: 'red_flag', descricao: 'Gentileza como moeda de troca', comoVaza: 'lembra o que fez por ela e cobra reciprocidade' },
      { id: 'fala_mal_ex', tipo: 'red_flag', descricao: 'Fala mal das ex', comoVaza: 'chama a ex de "interesseira" ou "louca"' },
      { id: 'ressentido', tipo: 'red_flag', descricao: 'Ressentido com mulheres', comoVaza: 'generaliza: "mulheres hoje em dia só querem cafajeste"' },
    ],
    cenasFavoritas: ['livraria', 'cafe', 'academia'],
  },
];

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);

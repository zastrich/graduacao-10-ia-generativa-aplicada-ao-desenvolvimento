const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '..', 'assets', 'carta-de-servicos-sjp-pr');

// Caractere placeholder (a sequência "ï¿½" em UTF-8 que representa o U+FFFD double-encoded)
const PLACEHOLDER = 'ï¿½';

/**
 * Dicionário de substituições baseado em padrões de palavras portuguesas.
 * Cada entrada mapeia um padrão (com PLACEHOLDER) para o texto correto.
 * A ordem importa: padrões mais longos/específicos primeiro.
 */
const REPLACEMENTS = [
  // Palavras com ção/ções (dois placeholders seguidos)
  ['ção', 'ção'],   // padrão genérico: ç = placeholder, ã = placeholder
  ['ções', 'ções'],

  // Palavras específicas frequentes
  ['SAÚDE', 'SAÚDE'],
  ['Saúde', 'Saúde'],
  ['saúde', 'saúde'],
  ['Público', 'Público'],
  ['público', 'público'],
  ['Públicas', 'Públicas'],
  ['públicas', 'públicas'],
  ['Cidadão', 'Cidadão'],
  ['cidadão', 'cidadão'],
  ['São', 'São'],
  ['SÃO', 'SÃO'],
  ['são', 'são'],
  ['José', 'José'],
  ['JOSÉ', 'JOSÉ'],
  ['Não', 'Não'],
  ['não', 'não'],
  ['através', 'através'],
  ['Através', 'Através'],
  ['número', 'número'],
  ['máximo', 'máximo'],
  ['técnico', 'técnico'],
  ['técnica', 'técnica'],
  ['técnicas', 'técnicas'],
  ['serviço', 'serviço'],
  ['Serviço', 'Serviço'],
  ['serviços', 'serviços'],
  ['Serviços', 'Serviços'],
  ['usuário', 'usuário'],
  ['usuários', 'usuários'],
  ['necessárias', 'necessárias'],
  ['necessário', 'necessário'],
  ['necessários', 'necessários'],
  ['Previsão', 'Previsão'],
  ['previsão', 'previsão'],
  ['Divisão', 'Divisão'],
  ['divisão', 'divisão'],
  ['será', 'será'],
  ['serão', 'serão'],
  ['imóvel', 'imóvel'],
  ['imóveis', 'imóveis'],
  ['Trânsito', 'Trânsito'],
  ['TRÂNSITO', 'TRÂNSITO'],
  ['Assistência', 'Assistência'],
  ['ASSISTÊNCIA', 'ASSISTÊNCIA'],
  ['assistência', 'assistência'],
  ['Certidão', 'Certidão'],
  ['certidão', 'certidão'],
  ['Balcão', 'Balcão'],
  ['balcão', 'balcão'],
  ['telefônico', 'telefônico'],
  ['análise', 'análise'],
  ['endereço', 'endereço'],
  ['Município', 'Município'],
  ['município', 'município'],
  ['residência', 'residência'],
  ['disponível', 'disponível'],
  ['após', 'após'],
  ['Referência', 'Referência'],
  ['referência', 'referência'],
  ['deverá', 'deverá'],
  ['poderá', 'poderá'],
  ['proprietário', 'proprietário'],
  ['emissão', 'emissão'],
  ['matrícula', 'matrícula'],
  ['pública', 'pública'],
  ['Cópia', 'Cópia'],
  ['cópia', 'cópia'],
  ['Variável', 'Variável'],
  ['variável', 'variável'],
  ['família', 'família'],
  ['famílias', 'famílias'],
  ['Patrimônio', 'Patrimônio'],
  ['patrimônio', 'patrimônio'],
  ['complementações', 'complementações'],
  ['órgãos', 'órgãos'],
  ['órgão', 'órgão'],
  ['Órgãos', 'Órgãos'],
  ['Órgão', 'Órgão'],
  ['avaliação', 'avaliação'],
  ['correções', 'correções'],
  ['núcleo', 'núcleo'],
  ['políticas', 'políticas'],
  ['úteis', 'úteis'],
  ['área', 'área'],
  ['Área', 'Área'],
  ['áreas', 'áreas'],
  ['crianças', 'crianças'],
  ['Crianças', 'Crianças'],
  ['Vigilância', 'Vigilância'],
  ['vigilância', 'vigilância'],
  ['Física', 'Física'],
  ['física', 'física'],
  ['físico', 'físico'],
  ['convívio', 'convívio'],
  ['conclusão', 'conclusão'],
  ['condições', 'condições'],
  ['início', 'início'],
  ['próprio', 'próprio'],
  ['estão', 'estão'],
  ['está', 'está'],
  ['exercício', 'exercício'],
  ['território', 'território'],
  ['você', 'você'],
  ['relatórios', 'relatórios'],
  ['farão', 'farão'],
  ['inclusão', 'inclusão'],
  ['denúncias', 'denúncias'],
  ['concorrência', 'concorrência'],
  ['deficiência', 'deficiência'],
  ['prática', 'prática'],
  ['há', 'há'],   
  ['às', 'às'],
  ['dá', 'dá'],
  ['só', 'só'],
  ['até', 'até'],
  ['responsável', 'responsável'],
  ['Reunião', 'Reunião'],
  ['reunião', 'reunião'],
  ['Educação', 'Educação'],
  ['educação', 'educação'],
  ['inscrição', 'inscrição'],
  ['Inscrição', 'Inscrição'],
  ['execução', 'execução'],
  ['Solicitação', 'Solicitação'],
  ['solicitação', 'solicitação'],
  ['elaboração', 'elaboração'],
  ['articulação', 'articulação'],
  ['mobilização', 'mobilização'],
  ['autorização', 'autorização'],
  ['aprovação', 'aprovação'],
  ['construção', 'construção'],
  ['declaração', 'declaração'],
  ['Declaração', 'Declaração'],
  ['apresentação', 'apresentação'],
  ['relação', 'relação'],
  ['Duração', 'Duração'],
  ['duração', 'duração'],
  ['ligação', 'ligação'],
  ['alterações', 'alterações'],
  ['identificação', 'identificação'],
  ['documentação', 'documentação'],
  ['documentações', 'documentações'],
  ['orientação', 'orientação'],
  ['situação', 'situação'],
  ['prestação', 'prestação'],
  ['comunicação', 'comunicação'],
  ['manifestação', 'manifestação'],
  ['manifestações', 'manifestações'],
  ['informações', 'informações'],
  ['Descrição', 'Descrição'],
  ['descrição', 'descrição'],
  ['Recepção', 'Recepção'],
  ['recepção', 'recepção'],
];

/**
 * Gera o padrão "corrompido" a partir do texto correto.
 * Cada caractere acentuado (com codepoint > 127) vira o PLACEHOLDER.
 */
function generateCorruptedPattern(correctText) {
  return [...correctText].map(ch => ch.charCodeAt(0) > 127 ? PLACEHOLDER : ch).join('');
}

/**
 * Constrói o mapa de substituições: padrão corrompido → texto correto.
 * Ordena por tamanho decrescente para substituir padrões mais longos primeiro.
 */
function buildReplacementMap() {
  const map = [];

  for (const [_, correct] of REPLACEMENTS) {
    const corrupted = generateCorruptedPattern(correct);
    if (corrupted !== correct) {
      map.push({ corrupted, correct });
    }
  }

  // Remove duplicatas
  const seen = new Set();
  const unique = [];
  for (const entry of map) {
    if (!seen.has(entry.corrupted)) {
      seen.add(entry.corrupted);
      unique.push(entry);
    }
  }

  // Ordena por tamanho do padrão corrompido (maior primeiro)
  unique.sort((a, b) => b.corrupted.length - a.corrupted.length);

  return unique;
}

/**
 * Corrige o encoding de um texto aplicando as substituições do dicionário
 * e depois tratando placeholders restantes com heurísticas de contexto.
 */
function fixText(text) {
  const replacementMap = buildReplacementMap();

  // Fase 1: Substituições baseadas em dicionário (padrões longos primeiro)
  for (const { corrupted, correct } of replacementMap) {
    text = text.split(corrupted).join(correct);
  }

  // Fase 2: Para placeholders restantes, tenta inferir pelo contexto
  // Padrões genéricos comuns em português
  const contextPatterns = [
    // [?] entre consoante e vogal comum (ex: servi[?]o -> ç antes de o)
    { regex: new RegExp(`(\\w)${escapeRegex(PLACEHOLDER)}(ão|ões|ão|ões)`, 'g'), replace: '$1ç$2' },
    // Acentos agudos comuns antes de consoante ou final
    { regex: new RegExp(`([aeiou])${escapeRegex(PLACEHOLDER)}([^a-zA-Z])`, 'g'), inferFn: inferAccent },
    // Placeholder isolado no início (Ó, É, Á, etc.)
    { regex: new RegExp(`(?<=[^a-zA-Z])${escapeRegex(PLACEHOLDER)}([a-z])`, 'g'), inferFn: inferInitialAccent },
  ];

  // Fase 2 simples: substituir placeholders remanescentes pelo caractere mais provável
  // baseado nas letras vizinhas
  let remaining = (text.match(new RegExp(escapeRegex(PLACEHOLDER), 'g')) || []).length;
  if (remaining > 0) {
    text = applyContextHeuristics(text);
  }

  return text;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Heurísticas de contexto para placeholders restantes.
 */
function applyContextHeuristics(text) {
  const ph = PLACEHOLDER;
  const phEscaped = escapeRegex(ph);

  // Padrões frequentes em português onde podemos inferir o caractere
  const heuristics = [
    // ção / ções (caso ainda restem)
    [new RegExp(`${phEscaped}${phEscaped}o\\b`, 'g'), 'ção'],
    [new RegExp(`${phEscaped}${phEscaped}es\\b`, 'g'), 'ções'],
    [new RegExp(`${phEscaped}${phEscaped}O\\b`, 'g'), 'ÇÃO'],
    [new RegExp(`${phEscaped}${phEscaped}ES\\b`, 'g'), 'ÇÕES'],

    // nº (abreviação de número)
    [new RegExp(`([Nn])${phEscaped}(\\s|\\d|<)`, 'g'), '$1º$2'],
    [new RegExp(`([Nn])${phEscaped}$`, 'gm'), '$1º'],

    // Ordinais: 1ª, 2ª, 3ª, 1º, 2º, 3º etc.
    [new RegExp(`(\\d)${phEscaped}`, 'g'), '$1ª'],

    // Água / água / Águas
    [new RegExp(`${phEscaped}gua`, 'g'), 'Água'],
    [new RegExp(`${phEscaped}guas`, 'g'), 'Águas'],

    // Árvore / árvores
    [new RegExp(`${phEscaped}rvore`, 'g'), 'árvore'],
    [new RegExp(`${phEscaped}rvores`, 'g'), 'árvores'],

    // Índice / índices
    [new RegExp(`${phEscaped}ndice`, 'g'), 'índice'],
    [new RegExp(`${phEscaped}ndices`, 'g'), 'índices'],

    // Último / últimos / última
    [new RegExp(`${phEscaped}ltimo`, 'g'), 'último'],
    [new RegExp(`${phEscaped}ltimos`, 'g'), 'últimos'],
    [new RegExp(`${phEscaped}ltima`, 'g'), 'última'],

    // Âmbito
    [new RegExp(`${phEscaped}mbito`, 'g'), 'âmbito'],

    // Álcool
    [new RegExp(`${phEscaped}lcool`, 'g'), 'álcool'],

    // Ônibus
    [new RegExp(`${phEscaped}nibus`, 'g'), 'ônibus'],

    // Óbito
    [new RegExp(`${phEscaped}bito`, 'g'), 'óbito'],

    // Útil / úteis
    [new RegExp(`${phEscaped}til\\b`, 'g'), 'útil'],
    [new RegExp(`${phEscaped}teis\\b`, 'g'), 'úteis'],

    // Único / única
    [new RegExp(`${phEscaped}nico`, 'g'), 'único'],
    [new RegExp(`${phEscaped}nica`, 'g'), 'única'],

    // Ólio / auxílio
    [new RegExp(`${phEscaped}lio`, 'g'), 'ílio'],

    // Ícone
    [new RegExp(`${phEscaped}cone`, 'g'), 'ícone'],

    // Ênfase
    [new RegExp(`${phEscaped}nfase`, 'g'), 'ênfase'],

    // Ângelo
    [new RegExp(`${phEscaped}ngelo`, 'g'), 'Ângelo'],

    // Àquela
    [new RegExp(`${phEscaped}quela`, 'g'), 'àquela'],

    // Alvará
    [new RegExp(`([Aa])lvar${phEscaped}`, 'g'), '$1lvará'],

    // Guatupê
    [new RegExp(`([Gg])uatup${phEscaped}`, 'g'), '$1uatupê'],

    // Paraná
    [new RegExp(`([Pp])aran${phEscaped}`, 'g'), '$1araná'],

    // Ipê
    [new RegExp(`([Ii])p${phEscaped}\\b`, 'g'), '$1pê'],

    // Mangá
    [new RegExp(`([Mm])ang${phEscaped}\\b`, 'g'), '$1angá'],

    // Metrô
    [new RegExp(`([Mm])etr${phEscaped}\\b`, 'g'), '$1etrô'],

    // Balé
    [new RegExp(`([Bb])al${phEscaped}\\b`, 'g'), '$1alé'],

    // Prévio / prévia
    [new RegExp(`([Pp])r${phEscaped}vi`, 'g'), '$1révi'],

    // Futuro do indicativo: verbos terminando em -rá, -rão
    [new RegExp(`(\\w+e)r${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1rá'],  // receberá
    [new RegExp(`(\\w+a)r${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1rá'],  // entrará
    [new RegExp(`(\\w+i)r${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1rá'],  // emitirá

    // Verbos e palavras curtas com á
    [new RegExp(`(?<=\\s)([Ss])er${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1erá'],
    [new RegExp(`(?<=\\s)([Ee])st${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1stá'],
    [new RegExp(`(?<=\\s)([Hh])${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1á'],
    [new RegExp(`(?<=\\s)([Dd])${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1á'],
    [new RegExp(`(?<=\\s)([Jj])${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1á'],
    [new RegExp(`(?<=[\\s>])${phEscaped}s(?=[\\s,;.!?<])`, 'g'), 'às'],

    // Palavras com ê
    [new RegExp(`(?<=\\s)([Tt])${phEscaped}m(?=[\\s,;.!?<])`, 'g'), '$1êm'],
    [new RegExp(`(?<=\\s)([Vv])oc${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1ocê'],

    // Vogais acentuadas comuns em contextos específicos
    [new RegExp(`pr${phEscaped}(ximo|xima|via|vio)`, 'gi'), 'pró$1'],

    // ú em palavras comuns
    [new RegExp(`([Ss][Aa])${phEscaped}([Dd][Ee])`, 'g'), '$1ú$2'],
    [new RegExp(`([Pp])${phEscaped}blico`, 'gi'), '$1úblico'],
    [new RegExp(`([Nn])${phEscaped}mero`, 'gi'), '$1úmero'],
    [new RegExp(`([Nn])${phEscaped}cleo`, 'gi'), '$1úcleo'],
    [new RegExp(`([Dd])${phEscaped}vida`, 'gi'), '$1úvida'],
    [new RegExp(`([Tt])${phEscaped}nel`, 'gi'), '$1únel'],
    [new RegExp(`([Mm])${phEscaped}nic`, 'gi'), '$1uníc'],

    // í em palavras comuns
    [new RegExp(`([Ff])${phEscaped}sic`, 'gi'), '$1ísic'],
    [new RegExp(`([Ii])n${phEscaped}cio`, 'gi'), '$1nício'],
    [new RegExp(`([Mm])${phEscaped}nim`, 'gi'), '$1ínim'],
    [new RegExp(`([Hh])or${phEscaped}rio`, 'gi'), '$1orário'],
    [new RegExp(`([Mm])atr${phEscaped}cula`, 'gi'), '$1atrícula'],
    [new RegExp(`([Dd])ispon${phEscaped}vel`, 'gi'), '$1isponível'],
    [new RegExp(`([Rr])espons${phEscaped}vel`, 'gi'), '$1esponsável'],
    [new RegExp(`([Pp])oss${phEscaped}vel`, 'gi'), '$1ossível'],

    // ã em palavras comuns
    [new RegExp(`([Cc])idad${phEscaped}o`, 'gi'), '$1idadão'],
    [new RegExp(`([Mm])${phEscaped}o\\b`, 'g'), '$1ão'],
    [new RegExp(`([Nn])${phEscaped}o\\b`, 'g'), '$1ão'],
    [new RegExp(`([Ss])${phEscaped}o\\b`, 'g'), '$1ão'],

    // ô
    [new RegExp(`([Tt])elef${phEscaped}nic`, 'gi'), '$1elefônic'],
    [new RegExp(`([Aa])uton${phEscaped}m`, 'gi'), '$1utonôm'],

    // â
    [new RegExp(`([Tt])r${phEscaped}nsit`, 'gi'), '$1rânsit'],
    [new RegExp(`([Ss])ubst${phEscaped}ncia`, 'gi'), '$1ubstância'],

    // é (placeholder isolado entre espaços ou pontuação)
    [new RegExp(`(?<=\\s)${phEscaped}(?=\\s)`, 'g'), 'é'],
    [new RegExp(`(?<=\\s)${phEscaped}(?=[,;.!?<])`, 'g'), 'é'],
    [new RegExp(`(?<=[>])${phEscaped}(?=\\s)`, 'g'), 'é'],
    [new RegExp(`([Nn])ecess${phEscaped}ri`, 'gi'), '$1ecessári'],
    [new RegExp(`([Aa])t${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1té'],
    [new RegExp(`([Ss])${phEscaped}rie`, 'gi'), '$1érie'],
    [new RegExp(`([Cc])r${phEscaped}dit`, 'gi'), '$1rédit'],
    [new RegExp(`(?<=\\s)([Jj])${phEscaped}(?=[\\s,;.!?<])`, 'g'), '$1á'],

    // ó
    [new RegExp(`([Oo])brigat${phEscaped}ri`, 'gi'), '$1brigatóri'],
    [new RegExp(`([Rr])elat${phEscaped}ri`, 'gi'), '$1elatóri'],
    [new RegExp(`([Hh])ist${phEscaped}ri`, 'gi'), '$1istóri'],
    [new RegExp(`([Cc])art${phEscaped}ri`, 'gi'), '$1artóri'],
    [new RegExp(`([Nn])ecess${phEscaped}rio`, 'gi'), '$1ecessário'],

    // ç antes de a, e, i, o, u
    [new RegExp(`([a-zA-Z])${phEscaped}([aeiou])`, 'g'), (match, before, after) => {
      return before + 'ç' + after;
    }],

    // á genérico (placeholder após consoante antes de s, l, r, ou fim de palavra / pontuação)
    [new RegExp(`([bcdfghjklmnpqrstvwxyz])${phEscaped}([sl])`, 'gi'), '$1á$2'],
    [new RegExp(`([bcdfghjklmnpqrstvwxyz])${phEscaped}(?=[\\s,;.!?<])`, 'gi'), '$1á'],

    // ê genérico (entre consoantes, frequente em português)
    [new RegExp(`([bcdfghjklmnpqrstvwxyz])${phEscaped}([bcdfghjklmnpqrstvwxyz])`, 'gi'), '$1ê$2'],

    // Placeholder no início de linha ou após pontuação + espaço (provavelmente É ou À)
    [new RegExp(`(^|[.!?:;]\\s*)${phEscaped}`, 'gm'), '$1É'],

    // Placeholder restante isolado (catch-all) — assume é
    [new RegExp(`${phEscaped}`, 'g'), 'é'],
  ];

  for (const [regex, replacement] of heuristics) {
    text = text.replace(regex, replacement);
  }

  return text;
}

function inferAccent(match, vowel, after) {
  return vowel + 'á' + after; // default to acute accent
}

function inferInitialAccent(match, next) {
  return 'É' + next; // default to É for initial placeholder
}

/**
 * Processa todos os arquivos .txt na pasta de assets.
 */
function main() {
  const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.txt'));
  console.log(`Encontrados ${files.length} arquivos .txt para processar.`);

  let fixed = 0;
  let alreadyOk = 0;
  let totalReplacements = 0;
  let remainingPlaceholders = 0;
  let postFixCount = 0;

  // Correções de pós-processamento para erros de heurísticas anteriores
  const postFixes = [
    [/doé-los/g, 'doá-los'],
    [/deixé-los/g, 'deixá-los'],
    [/mantê-los/g, 'mantê-los'], // este está correto, manter
    [/tràs/g, 'trás'],
    [/manté-los/g, 'mantê-los'],
    [/temporério/g, 'temporário'],
    [/ofécios/g, 'ofícios'],
    [/docuemntaéa/g, 'documentaçã'], // typo no original, manter como está
  ];

  for (const file of files) {
    const filePath = path.join(ASSETS_DIR, file);
    let originalText = fs.readFileSync(filePath, 'utf-8');
    let text = originalText;
    let modified = false;

    // Fase principal: corrigir placeholders ï¿½
    if (text.includes(PLACEHOLDER)) {
      const countBefore = (text.match(new RegExp(escapeRegex(PLACEHOLDER), 'g')) || []).length;
      text = fixText(text);
      const countAfter = (text.match(new RegExp(escapeRegex(PLACEHOLDER), 'g')) || []).length;
      totalReplacements += (countBefore - countAfter);
      remainingPlaceholders += countAfter;
      modified = true;
    }

    // Fase de pós-processamento: corrigir erros de heurísticas anteriores
    for (const [pattern, replacement] of postFixes) {
      if (pattern.test(text)) {
        text = text.replace(pattern, replacement);
        modified = true;
        postFixCount++;
      }
      // Reset regex lastIndex
      pattern.lastIndex = 0;
    }

    if (modified && text !== originalText) {
      fs.writeFileSync(filePath, text, 'utf-8');
      fixed++;
    } else {
      alreadyOk++;
    }
  }

  console.log(`\nResultado:`);
  console.log(`  Arquivos corrigidos: ${fixed}`);
  console.log(`  Arquivos já corretos: ${alreadyOk}`);
  console.log(`  Total de caracteres restaurados: ${totalReplacements}`);
  console.log(`  Correções de pós-processamento: ${postFixCount}`);
  if (remainingPlaceholders > 0) {
    console.log(`  Placeholders restantes (não resolvidos): ${remainingPlaceholders}`);
    console.log(`  (Pode ser necessário adicionar mais padrões ao dicionário)`);
  } else {
    console.log(`  Todos os placeholders foram resolvidos!`);
  }
}

main();

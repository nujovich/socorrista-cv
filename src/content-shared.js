/* ===== Simulador Socorrista CV — contenido compartido =====
   Fuente: temario FSSCV curso 11/26AL (notas Sanity), Manual RFESS de
   Primeros Auxilios (2017/2025) y "Técnicas de rescate y lesión medular
   en el medio acuático" (RFESS 2015). Corrección de Raquel 28-09-2026. */

const T = (es, va) => ({ es, va });

const UI = {
  appName: T('Simulador de socorrismo acuático', 'Simulador de socorrisme aquàtic'),
  tagline: T('Comunitat Valenciana · temario FSSCV / RFESS', 'Comunitat Valenciana · temari FSSCV / RFESS'),
  nav: { cases: T('Casos', 'Casos'), exam: T('Examen', 'Examen'), dialog: T('Diálogo', 'Diàleg'), progress: T('Progreso', 'Progrés') },
  env: { piscina: T('Piscina', 'Piscina'), playa: T('Playa', 'Platja'), parque: T('Parque acuático', 'Parc aquàtic'), aguas: T('Aguas abiertas', 'Aigües obertes') },
  sit: {
    ahogamiento: T('Ahogamiento', 'Ofegament'), rcp: T('RCP y DESA', 'RCP i DESA'), medular: T('Lesión medular', 'Lesió medul·lar'),
    hipotermia: T('Hipotermia', 'Hipotèrmia'), calor: T('Golpe de calor', 'Colp de calor'), medusa: T('Medusas', 'Meduses'),
    herida: T('Heridas y hemorragias', 'Ferides i hemorràgies'), ovace: T('OVACE', 'OVACE'), convulsion: T('Crisis convulsiva', 'Crisi convulsiva')
  },
  scope: { pa: T('Solo primeros auxilios', 'Només primers auxilis'), full: T('Completo: rescate + PA', 'Complet: rescat + PA') },
  scopeHint: T('La víctima ya está fuera del agua.', 'La víctima ja està fora de l\'aigua.'),
  start: T('Empezar el caso', 'Començar el cas'),
  whatNow: T('¿Qué haces ahora?', 'Què fas ara?'),
  stepOf: T('Paso', 'Pas'),
  correct: T('Correcto', 'Correcte'),
  notYet: T('Todavía no: ese paso llega más tarde.', 'Encara no: eixe pas arriba més tard.'),
  wrong: T('No es lo indicado', 'No és el que toca'),
  critical: T('Error crítico: en el examen invalidaría la prueba', 'Error crític: en l\'examen invalidaria la prova'),
  theRightOne: T('Lo correcto era:', 'El correcte era:'),
  continue: T('Continuar', 'Continuar'),
  finish: T('Ver resultado', 'Veure resultat'),
  result: T('Resultado del caso', 'Resultat del cas'),
  grade: T('Nota', 'Nota'),
  firstTry: T('pasos acertados a la primera', 'passos encertats a la primera'),
  critCount: T('errores críticos', 'errors crítics'),
  flagGreen: T('Bandera verde: protocolo correcto y seguro.', 'Bandera verda: protocol correcte i segur.'),
  flagYellow: T('Bandera amarilla: aprobarías con fallos. Repasa los pasos marcados.', 'Bandera groga: aprovaries amb errades. Repassa els passos marcats.'),
  flagRed: T('Bandera roja: una acción habría causado daño a la víctima. En el examen de la FSSCV eso invalida la prueba.', 'Bandera roja: una acció hauria causat dany a la víctima. En l\'examen de la FSSCV això invalida la prova.'),
  retry: T('Repetir el caso', 'Repetir el cas'),
  backToCases: T('Volver a los casos', 'Tornar als casos'),
  reviewSteps: T('Secuencia completa', 'Seqüència completa'),
  source: T('Fuente', 'Font'),
  victim: T('Víctima', 'Víctima'),
  scene: T('Escena', 'Escena'),
  info: T('Nota del temario', 'Nota del temari'),
  best: T('Mejor nota', 'Millor nota'),
  attempts: T('intentos', 'intents'),
  notDone: T('Sin hacer', 'Sense fer'),
  allEnv: T('Todos los entornos', 'Tots els entorns'),
  allSit: T('Todas las situaciones', 'Totes les situacions'),
  randomCase: T('Caso al azar', 'Cas a l\'atzar'),
  // Exam
  examIntro: T('Test tipo examen con preguntas del temario. Corrección al final, como en la FSSCV: una respuesta que causaría daño a la víctima invalida el examen y las preguntas en blanco no se admiten.', 'Test tipus examen amb preguntes del temari. Correcció al final, com en la FSSCV: una resposta que causaria dany a la víctima invalida l\'examen i les preguntes en blanc no s\'admeten.'),
  examShort: T('10 preguntas', '10 preguntes'), examLong: T('20 preguntas', '20 preguntes'),
  examStart: T('Empezar el examen', 'Començar l\'examen'),
  examSubmit: T('Corregir', 'Corregir'),
  examUnanswered: T('Te falta responder', 'Et falta respondre'),
  examQuestion: T('Pregunta', 'Pregunta'),
  examPass: T('Aprobado', 'Aprovat'), examFail: T('Suspenso', 'Suspés'),
  examInvalid: T('Examen invalidado', 'Examen invalidat'),
  examInvalidWhy: T('Has elegido una respuesta que causaría daño a la víctima. En la FSSCV eso invalida el examen aunque el resto esté bien.', 'Has triat una resposta que causaria dany a la víctima. En la FSSCV això invalida l\'examen encara que la resta estiga bé.'),
  examMin: T('Mínimo para aprobar Primeros Auxilios: 6', 'Mínim per a aprovar Primers Auxilis: 6'),
  yourAnswer: T('Tu respuesta', 'La teua resposta'),
  examAgain: T('Otro examen', 'Un altre examen'),
  // Dialog
  dialogIntro: T('Elige un caso. Interpreto a la víctima, a los testigos y al entorno; tú escribes lo que haces y lo que dices, paso a paso. Cuando termines, pide la evaluación.', 'Tria un cas. Interprete la víctima, els testimonis i l\'entorn; tu escrius el que fas i el que dius, pas a pas. Quan acabes, demana l\'avaluació.'),
  dialogUnavailable: T('El diálogo con IA no está disponible en esta vista. Puedes practicar el mismo caso en modo checklist.', 'El diàleg amb IA no està disponible en esta vista. Pots practicar el mateix cas en mode checklist.'),
  dialogStart: T('Iniciar simulacro', 'Iniciar simulacre'),
  dialogPlaceholder: T('Escribe lo que haces o dices…', 'Escriu el que fas o dius…'),
  dialogSend: T('Enviar', 'Enviar'),
  dialogEval: T('Terminar y evaluar', 'Acabar i avaluar'),
  dialogStop: T('Parar', 'Parar'),
  dialogThinking: T('Pensando…', 'Pensant…'),
  dialogNew: T('Nuevo simulacro', 'Nou simulacre'),
  dialogConsent: T('La primera vez el navegador te pedirá permiso para usar Claude desde esta página.', 'La primera vegada el navegador et demanarà permís per a usar Claude des d\'esta pàgina.'),
  errRate: T('Demasiadas peticiones seguidas. Espera un momento y vuelve a intentarlo.', 'Massa peticions seguides. Espera un moment i torna a intentar-ho.'),
  errGeneric: T('No se ha podido obtener respuesta. Inténtalo de nuevo.', 'No s\'ha pogut obtindre resposta. Torna a intentar-ho.'),
  errDenied: T('No se ha concedido permiso para usar Claude en esta página.', 'No s\'ha concedit permís per a usar Claude en esta pàgina.'),
  // Progress
  progressIntro: T('Tu avance se guarda en tu cuenta y se sincroniza entre móvil y ordenador.', 'El teu avanç es guarda en el teu compte i se sincronitza entre mòbil i ordinador.'),
  progressLocal: T('Guardado solo en este navegador (no has iniciado sesión o no se pudo sincronizar).', 'Guardat només en este navegador (no has iniciat sessió o no s\'ha pogut sincronitzar).'),
  casesDone: T('casos completados', 'casos completats'),
  avg: T('nota media', 'nota mitjana'),
  examsDone: T('exámenes', 'exàmens'),
  dialogsDone: T('simulacros con IA', 'simulacres amb IA'),
  lastExams: T('Últimos exámenes', 'Últims exàmens'),
  weak: T('Pasos donde has cometido errores críticos', 'Passos on has comés errors crítics'),
  noWeak: T('Ningún error crítico registrado. Sigue así.', 'Cap error crític registrat. Continua així.'),
  reset: T('Borrar mi progreso', 'Esborrar el meu progrés'),
  resetConfirm: T('¿Borrar todo el progreso guardado? No se puede deshacer.', 'Esborrar tot el progrés guardat? No es pot desfer.'),
  empty: T('Aún no hay datos. Resuelve un caso o haz un examen.', 'Encara no hi ha dades. Resol un cas o fes un examen.'),
  theme: T('Tema claro/oscuro', 'Tema clar/fosc'),
  rescuePhase: T('Rescate', 'Rescat'), paPhase: T('Primeros auxilios', 'Primers auxilis'),
  invalidTag: T('invalidado', 'invalidat'),
  hello: T('Hola', 'Hola'),
  progressOf: T('Progreso de', 'Progrés de'),
  nameLabel: T('Tu nombre', 'El teu nom'),
  namePlaceholder: T('Escribe tu nombre', 'Escriu el teu nom'),
  nameSave: T('Guardar', 'Guardar'),
  voiceAuto: T('Leer las respuestas en voz alta', 'Llegir les respostes en veu alta'),
  listen: T('Escuchar', 'Escoltar'),
  stopListen: T('Silenciar', 'Silenciar'),
  mic: T('Dictar', 'Dictar'),
  micListening: T('Escuchando… toca para parar', 'Escoltant… toca per a parar'),
  micUnavailable: T('Este navegador no permite dictar aquí; escribe el mensaje.', 'Este navegador no permet dictar ací; escriu el missatge.'),
  micDenied: T('El micrófono está bloqueado en esta vista. Revisa los permisos del navegador o escribe el mensaje.', 'El micròfon està bloquejat en esta vista. Revisa els permisos del navegador o escriu el missatge.'),
  ttsUnavailable: T('Este navegador no tiene voz para leer en alto.', 'Este navegador no té veu per a llegir en veu alta.'),
  apiTitle: T('Diálogo con tu propia clave de API', 'Diàleg amb la teua pròpia clau d\'API'),
  apiIntro: T('Fuera de claude.ai el simulacro necesita una clave de API de Anthropic. Se guarda solo en este navegador y las llamadas van directas a api.anthropic.com; el coste corre a cargo de tu cuenta de API.', 'Fora de claude.ai el simulacre necessita una clau d\'API d\'Anthropic. Es guarda només en este navegador i les crides van directes a api.anthropic.com; el cost va a càrrec del teu compte d\'API.'),
  apiKeyLabel: T('Clave de API', 'Clau d\'API'),
  apiModelLabel: T('Modelo', 'Model'),
  apiSave: T('Guardar clave', 'Guardar clau'),
  apiClear: T('Quitar clave', 'Llevar clau'),
  apiActive: T('Clave guardada en este navegador.', 'Clau guardada en este navegador.'),
  apiWarn: T('No compartas la clave ni la subas a ningún repositorio.', 'No compartisques la clau ni la puges a cap repositori.'),
  errApiKey: T('La clave de API no es válida o no tiene permiso.', 'La clau d\'API no és vàlida o no té permís.'),
  exportProgress: T('Exportar progreso', 'Exportar progrés'),
  importProgress: T('Importar progreso', 'Importar progrés'),
  importBad: T('El archivo no tiene el formato esperado.', 'L\'arxiu no té el format esperat.'),
};

/* ---------- Pasos reutilizables ----------
   step = { t, why, alts:[{t, why, crit}], ref }
   crit:true = acción que causa daño (en el examen invalida la prueba) */

const STEP = {
  signal: () => ({
    t: T('Activa la señal de rescate en marcha: pitada larga y aviso al compañero o al jefe de zona para que active el 112 y prepare el material y el DESA.',
         'Activa el senyal de rescat en marxa: xiulada llarga i avís al company o al cap de zona perquè active el 112 i prepare el material i el DESA.'),
    why: T('La intervención empieza activando la cadena: la pitada larga más la comunicación pone en marcha al equipo, que avisa al 112 y moviliza recursos mientras tú intervienes.',
           'La intervenció comença activant la cadena: la xiulada llarga més la comunicació posa en marxa l\'equip, que avisa el 112 i mobilitza recursos mentre tu intervens.'),
    ref: 'Tema 3.2 Protocolos de intervención',
    alts: [
      { t: T('Entrar al agua inmediatamente sin avisar a nadie.', 'Entrar a l\'aigua immediatament sense avisar ningú.'),
        why: T('Sin señal nadie activa el 112 ni trae el DESA: el rescate se queda sin cadena de emergencia.', 'Sense senyal ningú activa el 112 ni porta el DESA: el rescat es queda sense cadena d\'emergència.') },
      { t: T('Llamar tú al 112 desde el puesto y esperar instrucciones antes de entrar.', 'Cridar tu al 112 des del lloc i esperar instruccions abans d\'entrar.'),
        why: T('Pierdes el tiempo crítico del rescate. Delega el aviso con la señal y actúa.', 'Perds el temps crític del rescat. Delega l\'avís amb el senyal i actua.') },
      { t: T('Pedir a gritos a los bañistas que saquen ellos a la víctima.', 'Demanar a crits als banyistes que traguen ells la víctima.'),
        why: T('Los bañistas no tienen formación ni material: se convierten en nuevas víctimas potenciales.', 'Els banyistes no tenen formació ni material: es convertixen en noves víctimes potencials.') }
    ]
  }),

  entryPool: () => ({
    t: T('Entra al agua con el tubo de rescate con paso de gigante, inclinado hacia delante, sin perder el contacto visual con la víctima.',
         'Entra a l\'aigua amb el tub de rescat amb pas de gegant, inclinat cap avant, sense perdre el contacte visual amb la víctima.'),
    why: T('El material es tu EPI: flotabilidad, control y distancia. El paso de gigante mantiene la cabeza fuera y la vista en la víctima.',
           'El material és el teu EPI: flotabilitat, control i distància. El pas de gegant manté el cap fora i la vista en la víctima.'),
    ref: 'Salvamento C3 Entradas al agua',
    alts: [
      { crit: true, t: T('Lanzarte de cabeza en picado desde la silla de vigilancia.', 'Llançar-te de cap en picat des de la cadira de vigilància.'),
        why: T('El picado no se hace en piscinas y la altura máxima de entrada es 3 m: riesgo de lesión medular para ti.', 'El picat no es fa en piscines i l\'altura màxima d\'entrada és 3 m: risc de lesió medul·lar per a tu.') },
      { t: T('Entrar sin material para ir más rápido.', 'Entrar sense material per a anar més ràpid.'),
        why: T('Siempre con material interpuesto: evita el agarre, da flotabilidad, protege las vías aéreas y facilita el remolque.', 'Sempre amb material interposat: evita l\'agafada, dona flotabilitat, protegix les vies aèries i facilita el remolc.') },
      { t: T('Entrar de pie echando el cuerpo hacia atrás para no hundirte.', 'Entrar de peu tirant el cos cap arrere per a no enfonsar-te.'),
        why: T('El cuerpo va inclinado hacia delante: así no pierdes la referencia visual ni te golpeas con el bordillo.', 'El cos va inclinat cap avant: així no perds la referència visual ni et colpeges amb la vorera.') }
    ]
  }),

  approach: () => ({
    t: T('Nada hacia la víctima con la cabeza fuera del agua, sin dejar de mirarla.',
         'Neda cap a la víctima amb el cap fora de l\'aigua, sense deixar de mirar-la.'),
    why: T('Si pierdes el contacto visual puedes perder la posición de una víctima que se hunde.',
           'Si perds el contacte visual pots perdre la posició d\'una víctima que s\'enfonsa.'),
    ref: 'Salvamento C7 Técnica universal',
    alts: [
      { t: T('Nadar a crol con la cabeza dentro para llegar antes.', 'Nedar a crol amb el cap dins per a arribar abans.'),
        why: T('Ganas segundos y pierdes a la víctima de vista: si se sumerge, no sabrás dónde está.', 'Guanyes segons i perds la víctima de vista: si se submergix, no sabràs on està.') },
      { t: T('Pararte a mitad de camino para gritarle instrucciones.', 'Parar-te a mitjan camí per a cridar-li instruccions.'),
        why: T('No aporta nada a un inconsciente y retrasa el control.', 'No aporta res a un inconscient i retarda el control.') }
    ]
  }),

  controlUnconsciousPool: () => ({
    t: T('Gírala boca arriba (dedo mágico) y contrólala con el tubo por delante, los brazos sobre el material y las vías aéreas fuera del agua; mira si respira.',
         'Gira-la boca amunt (dit màgic) i controla-la amb el tub per davant, els braços sobre el material i les vies aèries fora de l\'aigua; mira si respira.'),
    why: T('Un inconsciente boca abajo no respira: lo primero es la vía aérea fuera del agua. El material por delante te da control y flotabilidad.',
           'Un inconscient boca avall no respira: el primer és la via aèria fora de l\'aigua. El material per davant et dona control i flotabilitat.'),
    ref: 'Salvamento C6 y C7',
    alts: [
      { crit: true, t: T('Remolcarla boca abajo agarrada por el pelo o el bañador.', 'Remolcar-la boca avall agafada pels cabells o pel banyador.'),
        why: T('Las vías aéreas quedan sumergidas durante todo el remolque: prolongas la hipoxia.', 'Les vies aèries queden submergides durant tot el remolc: prolongues la hipòxia.') },
      { t: T('Soltar el tubo y hacerle el boca a boca ahí mismo.', 'Soltar el tub i fer-li el boca a boca ací mateix.'),
        why: T('Ventilar en el agua solo tiene sentido con material clicado y si la extracción se va a demorar; en piscina el borde está cerca: prioriza sacarla.', 'Ventilar en l\'aigua només té sentit amb material clicat i si l\'extracció es retardarà; en piscina la vora està prop: prioritza traure-la.') },
      { t: T('Buscarle el pulso en el agua durante un minuto antes de moverla.', 'Buscar-li el pols en l\'aigua durant un minut abans de moure-la.'),
        why: T('En el agua la prioridad es vías fuera y extracción rápida; la valoración completa se hace fuera.', 'En l\'aigua la prioritat és vies fora i extracció ràpida; la valoració completa es fa fora.') }
    ]
  }),

  towPool: () => ({
    t: T('Remolca con el tubo clicado hasta el bordillo más cercano, manteniendo las vías aéreas fuera del agua.',
         'Remolca amb el tub clicat fins a la vorera més pròxima, mantenint les vies aèries fora de l\'aigua.'),
    why: T('El remolque con material te deja las manos libres y asegura la cabeza fuera; el punto de extracción es el más cercano y seguro.',
           'El remolc amb material et deixa les mans lliures i assegura el cap fora; el punt d\'extracció és el més pròxim i segur.'),
    ref: 'Salvamento C7 Control con material',
    alts: [
      { t: T('Remolcar hasta la escalera del fondo aunque esté más lejos.', 'Remolcar fins a l\'escala del fons encara que estiga més lluny.'),
        why: T('Cada metro de más es tiempo sin ventilar: extrae por el punto más cercano.', 'Cada metre de més és temps sense ventilar: extrau pel punt més pròxim.') },
      { t: T('Remolcar cuerpo a cuerpo sin el tubo para ir más rápido.', 'Remolcar cos a cos sense el tub per a anar més ràpid.'),
        why: T('Pierdes flotabilidad y el control de la cabeza; el tubo clicado funciona como un aro.', 'Perds flotabilitat i el control del cap; el tub clicat funciona com un cercle.') }
    ]
  }),

  extractPool: () => ({
    t: T('Extracción por el bordillo con tu compañera: flexiona las piernas, nunca el tronco, y túmbala en decúbito supino sobre el borde.',
         'Extracció per la vorera amb la teua companya: flexiona les cames, mai el tronc, i gita-la en decúbit supí sobre la vora.'),
    why: T('La extracción rápida y segura es lo que permite empezar el soporte vital; protege tu espalda.',
           'L\'extracció ràpida i segura és el que permet començar el suport vital; protegix la teua esquena.'),
    ref: 'Salvamento C8 Extracción',
    alts: [
      { crit: true, t: T('Esperar dentro del agua sujetándola hasta que llegue la ambulancia.', 'Esperar dins de l\'aigua subjectant-la fins que arribe l\'ambulància.'),
        why: T('Cada minuto sin soporte vital reduce la supervivencia; la extracción no se demora.', 'Cada minut sense suport vital reduïx la supervivència; l\'extracció no es retarda.') },
      { crit: true, t: T('Sentarla en el bordillo para que escupa el agua.', 'Asseure-la en la vorera perquè escupa l\'aigua.'),
        why: T('No respira: no puede escupir nada. Sentarla retrasa la RCP y favorece el vómito.', 'No respira: no pot escopir res. Asseure-la retarda l\'RCP i afavorix el vòmit.') },
      { t: T('Subirla tú sola por la escalera de espaldas.', 'Pujar-la tu sola per l\'escala d\'esquena.'),
        why: T('Con ayuda disponible, la extracción por el bordillo es más rápida y segura para las dos.', 'Amb ajuda disponible, l\'extracció per la vorera és més ràpida i segura per a les dos.') }
    ]
  }),

  consciousness: () => ({
    t: T('Comprueba la consciencia: sacúdela suavemente por los hombros y pregúntale si está bien.',
         'Comprova la consciència: sacseja-la suaument pels muscles i pregunta-li si està bé.'),
    why: T('La valoración empieza por la consciencia, antes de pasar a la respiración (Raquel lo exige al extraer a un ahogado).',
           'La valoració comença per la consciència, abans de passar a la respiració (Raquel ho exigix en traure un ofegat).'),
    ref: 'U15 RCP básica · corrección 28-09',
    alts: [
      { t: T('Empezar compresiones torácicas de inmediato.', 'Començar compressions toràciques immediatament.'),
        why: T('Sin valorar consciencia y respiración no sabes si hay parada; sigue la secuencia.', 'Sense valorar consciència i respiració no saps si hi ha parada; seguix la seqüència.') },
      { crit: true, t: T('Hacerle compresiones abdominales (Heimlich) para sacarle el agua.', 'Fer-li compressions abdominals (Heimlich) per a traure-li l\'aigua.'),
        why: T('No es eficaz, retrasa la RCP y provoca vómito y aspiración. Solo se desobstruye si no se puede ventilar.', 'No és eficaç, retarda l\'RCP i provoca vòmit i aspiració. Només es desobstruïx si no es pot ventilar.') },
      { crit: true, t: T('Colocarla directamente en posición lateral de seguridad.', 'Col·locar-la directament en posició lateral de seguretat.'),
        why: T('La PLS es para quien respira. Sin comprobarlo puedes dejar en PLS a una víctima en parada.', 'La PLS és per a qui respira. Sense comprovar-ho pots deixar en PLS una víctima en parada.') }
    ]
  }),

  airwayCervical: () => ({
    t: T('A: abre la vía aérea con la maniobra frente-mentón manteniendo el control cervical.',
         'A: obri la via aèria amb la maniobra front-mentó mantenint el control cervical.'),
    why: T('En socorrismo acuático la A incluye siempre el control cervical: posible lesión medular por zambullida o golpe.',
           'En socorrisme aquàtic la A inclou sempre el control cervical: possible lesió medul·lar per capbussada o colp.'),
    ref: 'U11 Valoración primaria · corrección 28-09',
    alts: [
      { t: T('Hiperextender el cuello al máximo sin más.', 'Hiperestendre el coll al màxim sense més.'),
        why: T('Si hubiera lesión cervical la agravas. Apertura con control del eje; con sospecha clara, tracción mandibular.', 'Si hi haguera lesió cervical l\'agreuges. Obertura amb control de l\'eix; amb sospita clara, tracció mandibular.') },
      { t: T('Colocar la cánula de Guedel antes de comprobar si respira.', 'Col·locar la cànula de Guedel abans de comprovar si respira.'),
        why: T('Primero la valoración (VOS); la cánula es apoyo instrumental para el inconsciente, después.', 'Primer la valoració (VOS); la cànula és suport instrumental per a l\'inconscient, després.') },
      { t: T('Meter los dedos en la boca para sacar el agua.', 'Ficar els dits en la boca per a traure l\'aigua.'),
        why: T('No hay agua que sacar con los dedos; solo se retiran cuerpos extraños visibles, nunca a ciegas.', 'No hi ha aigua que traure amb els dits; només es retiren cossos estranys visibles, mai a cegues.') }
    ]
  }),

  breathingCheck: () => ({
    t: T('B: Ver, Oír, Sentir durante un máximo de 10 segundos. No respira; solo boquea (gasping).',
         'B: Veure, Oir, Sentir durant un màxim de 10 segons. No respira; només boqueja (gasping).'),
    why: T('El gasping no es respiración normal: se trata como parada. Toda la valoración inicial dura menos de un minuto.',
           'El gasping no és respiració normal: es tracta com a parada. Tota la valoració inicial dura menys d\'un minut.'),
    ref: 'U15 Valoración inicial',
    alts: [
      { t: T('Observar el pecho durante 30 segundos para estar segura.', 'Observar el pit durant 30 segons per a estar segura.'),
        why: T('Máximo 10 segundos: cada segundo de más es hipoxia.', 'Màxim 10 segons: cada segon de més és hipòxia.') },
      { t: T('Buscar el pulso radial durante un minuto antes de nada.', 'Buscar el pols radial durant un minut abans de res.'),
        why: T('En emergencias, el pulso se busca en la carótida y como máximo 10 s; en el ahogado la ventilación manda.', 'En emergències, el pols es busca en la caròtida i com a màxim 10 s; en l\'ofegat la ventilació mana.') },
      { t: T('Dar por hecho que respira porque boquea.', 'Donar per fet que respira perquè boqueja.'),
        why: T('Boquear (gasping) no es respirar: se inicia la reanimación.', 'Boquejar (gasping) no és respirar: s\'inicia la reanimació.') }
    ]
  }),

  fiveBreaths: () => ({
    t: T('Realiza 5 insuflaciones de rescate iniciales (con mascarilla de bolsillo si la tienes), cada una hasta ver una ligera elevación del tórax.',
         'Realitza 5 insuflacions de rescat inicials (amb mascareta de butxaca si la tens), cada una fins a veure una lleugera elevació del tòrax.'),
    why: T('En el ahogado el problema es la hipoxia: 5 insuflaciones antes de las compresiones (ERC/ILSF y RFESS). Ventila solo hasta ligera elevación para no provocar regurgitación.',
           'En l\'ofegat el problema és la hipòxia: 5 insuflacions abans de les compressions (ERC/ILSF i RFESS). Ventila només fins a lleugera elevació per a no provocar regurgitació.'),
    ref: 'U18 Ahogamiento y SVB · corrección 28-09',
    alts: [
      { t: T('Empezar directamente con 30 compresiones.', 'Començar directament amb 30 compressions.'),
        why: T('En el ahogado se empieza con 5 insuflaciones; el 30:2 viene después. Fue uno de los fallos corregidos por Raquel.', 'En l\'ofegat es comença amb 5 insuflacions; el 30:2 ve després. Va ser un dels errors corregits per Raquel.') },
      { t: T('Hacer solo 2 insuflaciones, como en el adulto estándar.', 'Fer només 2 insuflacions, com en l\'adult estàndard.'),
        why: T('Son 5 iniciales en el ahogado (y en el niño). Después, ciclos 30:2.', 'Són 5 inicials en l\'ofegat (i en el xiquet). Després, cicles 30:2.') },
      { crit: true, t: T('Compresiones abdominales para drenar el agua antes de ventilar.', 'Compressions abdominals per a drenar l\'aigua abans de ventilar.'),
        why: T('Ineficaces, retrasan la RCP y provocan vómito con aspiración. Nunca.', 'Ineficaces, retarden l\'RCP i provoquen vòmit amb aspiració. Mai.') }
    ]
  }),

  confirm112: () => ({
    t: T('Confirma que el 112 está activado y que el DESA viene de camino. Si estuvieras sola: tras las 5 insuflaciones, 5 ciclos de RCP (unos 2 minutos) antes de ir a avisar.',
         'Confirma que el 112 està activat i que el DESA ve de camí. Si estigueres sola: després de les 5 insuflacions, 5 cicles d\'RCP (uns 2 minuts) abans d\'anar a avisar.'),
    why: T('La RFESS marca en el ahogado: 5 ventilaciones, unos 2 minutos de RCP sin abandonar a la víctima y después avisar al 112 si nadie lo ha hecho.',
           'La RFESS marca en l\'ofegat: 5 ventilacions, uns 2 minuts d\'RCP sense abandonar la víctima i després avisar el 112 si ningú ho ha fet.'),
    ref: 'U18.7 Ahogamiento y soporte vital básico',
    alts: [
      { t: T('Dejar a la víctima ahora mismo para ir corriendo a llamar al 112.', 'Deixar la víctima ara mateix per a anar corrent a cridar el 112.'),
        why: T('Ya has activado la cadena con la señal. En el ahogado, si estás sola, primero 5 insuflaciones y unos 2 minutos de RCP.', 'Ja has activat la cadena amb el senyal. En l\'ofegat, si estàs sola, primer 5 insuflacions i uns 2 minuts d\'RCP.') },
      { crit: true, t: T('No avisar hasta que recupere la respiración.', 'No avisar fins que recupere la respiració.'),
        why: T('Sin SVA y DESA la supervivencia cae en picado; el aviso forma parte del protocolo.', 'Sense SVA i DESA la supervivència cau en picat; l\'avís forma part del protocol.') }
    ]
  }),

  cpr: () => ({
    t: T('RCP 30:2: talón de la mano en el centro del pecho, 100-120 por minuto, 5-6 cm, deja que el tórax se expanda; cabeza ladeada durante las compresiones para que drene el líquido.',
         'RCP 30:2: taló de la mà en el centre del pit, 100-120 per minut, 5-6 cm, deixa que el tòrax s\'expandisca; cap de costat durant les compressions perquè drene el líquid.'),
    why: T('Mismos parámetros que la RCP general; en el ahogado, cabeza de lado para favorecer la salida del líquido aspirado y ventilaciones hasta ligera elevación.',
           'Mateixos paràmetres que l\'RCP general; en l\'ofegat, cap de costat per a afavorir l\'eixida del líquid aspirat i ventilacions fins a lleugera elevació.'),
    ref: 'U15 y U18',
    alts: [
      { t: T('Ciclos 15:2.', 'Cicles 15:2.'),
        why: T('15:2 es la relación pediátrica con dos reanimadores. En el adulto, 30:2.', '15:2 és la relació pediàtrica amb dos reanimadors. En l\'adult, 30:2.') },
      { t: T('Comprimir a unas 80 por minuto para no agotarte.', 'Comprimir a unes 80 per minut per a no esgotar-te.'),
        why: T('100-120 por minuto. Si te cansas, relévate con la compañera cada 2 minutos.', '100-120 per minut. Si et canses, releva\'t amb la companya cada 2 minuts.') },
      { crit: true, t: T('Parar cada ciclo para intentar sacar el agua de los pulmones.', 'Parar cada cicle per a intentar traure l\'aigua dels pulmons.'),
        why: T('Las interrupciones matan. La espuma y el agua no se extraen: no se modifica el protocolo.', 'Les interrupcions maten. L\'escuma i l\'aigua no s\'extrauen: no es modifica el protocol.') }
    ]
  }),

  desaWet: (beach) => ({
    t: beach
      ? T('Llega el DESA: aparta a la víctima de la zona mojada, seca el tórax y retira la arena; parches bajo la clavícula derecha y bajo la axila izquierda; "todos fuera" en la descarga y reanuda la RCP 2 minutos.',
          'Arriba el DESA: aparta la víctima de la zona mullada, asseca el tòrax i retira l\'arena; pegats davall la clavícula dreta i davall l\'aixella esquerra; "tots fora" en la descàrrega i reprén l\'RCP 2 minuts.')
      : T('Llega el DESA: seca el tórax y asegúrate de que no está sobre suelo mojado; parches bajo la clavícula derecha y bajo la axila izquierda; sigue sus instrucciones, "todos fuera" en la descarga y reanuda la RCP 2 minutos.',
          'Arriba el DESA: asseca el tòrax i assegura\'t que no està sobre terra mullada; pegats davall la clavícula dreta i davall l\'aixella esquerra; seguix les instruccions, "tots fora" en la descàrrega i reprén l\'RCP 2 minuts.'),
    why: T('Desfibrilación en 3-5 minutos: supervivencia del 49-75 %. Tórax seco y sin arena para que peguen los parches; nunca descargar sobre suelo mojado.',
           'Desfibril·lació en 3-5 minuts: supervivència del 49-75 %. Tòrax sec i sense arena perquè s\'apeguen els pegats; mai descarregar sobre terra mullada.'),
    ref: 'U16 DESA · U18',
    alts: [
      { crit: true, t: T('Descargar sin secar, con la víctima sobre el suelo mojado.', 'Descarregar sense assecar, amb la víctima sobre terra mullada.'),
        why: T('Riesgo eléctrico para ti y los que ayudan, y mala adhesión de los parches.', 'Risc elèctric per a tu i els que ajuden, i mala adhesió dels pegats.') },
      { t: T('Colocar los parches en el esternón y la espalda.', 'Col·locar els pegats en l\'estern i l\'esquena.'),
        why: T('La posición anteroposterior es para niños (≤8 años / ≤25 kg). En el adulto: clavícula derecha y axila izquierda.', 'La posició anteroposterior és per a xiquets (≤8 anys / ≤25 kg). En l\'adult: clavícula dreta i aixella esquerra.') },
      { crit: true, t: T('Dejar de comprimir mientras preparas el DESA.', 'Deixar de comprimir mentre prepares el DESA.'),
        why: T('Las compresiones continúan mientras otra persona coloca los parches; solo se interrumpen para analizar y descargar.', 'Les compressions continuen mentre una altra persona col·loca els pegats; només s\'interrompen per a analitzar i descarregar.') }
    ]
  }),

  continueCpr: () => ({
    t: T('Continúa hasta que recupere signos de vida, te releve el equipo de SVA o te agotes. Si respira: PLS, manta térmica (dorado hacia fuera) y reevaluación constante; informa al SVA de las circunstancias (ahogamiento, agua fría).',
         'Continua fins que recupere signes de vida, et releve l\'equip de SVA o t\'esgotes. Si respira: PLS, manta tèrmica (daurat cap a fora) i reavaluació constant; informa el SVA de les circumstàncies (ofegament, aigua freda).'),
    why: T('La hipotermia protege las neuronas: una RCP prolongada en el ahogado puede recuperar funciones sin lesión. Quien respira sale mojado y pierde calor en minutos.',
           'La hipotèrmia protegix les neurones: una RCP prolongada en l\'ofegat pot recuperar funcions sense lesió. Qui respira ix mullat i perd calor en minuts.'),
    ref: 'U15 Cuándo parar · U18',
    alts: [
      { t: T('Suspender la RCP a los 10 minutos si no responde.', 'Suspendre l\'RCP als 10 minuts si no respon.'),
        why: T('En el ahogado con hipotermia la RCP se mantiene de forma prolongada: solo paras por recuperación, relevo o agotamiento.', 'En l\'ofegat amb hipotèrmia l\'RCP es manté de forma prolongada: només pares per recuperació, relleu o esgotament.') },
      { crit: true, t: T('Darle de beber en cuanto reacciona.', 'Donar-li de beure tan prompte com reacciona.'),
        why: T('Nunca por boca a quien no está plenamente consciente: riesgo de aspiración.', 'Mai per boca a qui no està plenament conscient: risc d\'aspiració.') },
      { t: T('Dejarla sola cuando respire para ir a buscar al SVA.', 'Deixar-la sola quan respire per a anar a buscar el SVA.'),
        why: T('Nunca se deja sola a la víctima: puede volver a parar o vomitar. Reevaluación constante.', 'Mai es deixa sola la víctima: pot tornar a parar o vomitar. Reavaluació constant.') }
    ]
  }),

  gloves: () => ({
    t: T('Ponte los guantes y asegura la escena antes de tocar a la víctima (bioseguridad: todo contacto es potencialmente infeccioso).',
         'Posa\'t els guants i assegura l\'escena abans de tocar la víctima (bioseguretat: tot contacte és potencialment infecciós).'),
    why: T('P de PAS: protección propia y de la escena. Guantes de nitrilo si hay alergia al látex.',
           'P de PAS: protecció pròpia i de l\'escena. Guants de nitril si hi ha al·lèrgia al làtex.'),
    ref: 'U14 Seguridad del interviniente',
    alts: [
      { t: T('Tocar la herida directamente para no perder tiempo.', 'Tocar la ferida directament per a no perdre temps.'),
        why: T('Diez segundos de guantes evitan contagios en los dos sentidos.', 'Deu segons de guants eviten contagis en els dos sentits.') },
      { t: T('Lavarte las manos con alcohol y actuar sin guantes.', 'Llavar-te les mans amb alcohol i actuar sense guants.'),
        why: T('El antiséptico no sustituye la barrera: guantes siempre.', 'L\'antisèptic no substituïx la barrera: guants sempre.') }
    ]
  })
};

/* ---------- Simulación (videojuego) ---------- */
UI.nav.game = T('Simulación', 'Simulació');
UI.game = {
  title: T('Simulación en tiempo real', 'Simulació en temps real'),
  intro: T('Vista desde arriba: activas la señal, coges el material, nadas, controlas a la víctima, la remolcas y la extraes. Después, primeros auxilios con mini-juegos de técnica (VOS, insuflaciones, RCP a ritmo, DESA) o decisiones contrarreloj. La víctima empeora mientras tardas.',
           'Vista des de dalt: actives el senyal, agafes el material, nedes, controles la víctima, la remolques i l\'extraus. Després, primers auxilis amb minijocs de tècnica (VOS, insuflacions, RCP a ritme, DESA) o decisions contrarellotge. La víctima empitjora mentre tardes.'),
  controls: T('Ordenador: flechas o WASD para moverte, espacio o E para actuar, X para la señal. Móvil: joystick a la izquierda, botón de acción a la derecha.',
              'Ordinador: fletxes o WASD per a moure\'t, espai o E per a actuar, X per al senyal. Mòbil: joystick a l\'esquerra, botó d\'acció a la dreta.'),
  modePcr: T('Rescate + RCP', 'Rescat + RCP'), modeDecisions: T('Rescate + decisiones', 'Rescat + decisions'),
  briefWater: T('Empieza en el puesto de vigilancia. El tubo de rescate está a tu lado: pásale por encima para cogerlo. Para activar la señal de rescate en marcha usa el botón del silbato (o la tecla X).',
                'Comences en el lloc de vigilància. El tub de rescat està al teu costat: passa-li per damunt per a agafar-lo. Per a activar el senyal de rescat en marxa usa el botó del xiulet (o la tecla X).'),
  briefLand: T('No hay fase de rescate: la víctima está en el suelo delante de ti. Cada decisión tarda unos segundos y la reserva de oxígeno baja mientras no actúas.',
               'No hi ha fase de rescat: la víctima està en terra davant de tu. Cada decisió tarda uns segons i la reserva d\'oxigen baixa mentre no actues.'),
  play: T('Jugar', 'Jugar'), backToList: T('Simulación', 'Simulació'),
  signalBtn: T('Señal', 'Senyal'), actionBtn: T('Actuar', 'Actuar'),
  startMsg: T('Has visto a la víctima. Activa la señal y coge el material.', 'Has vist la víctima. Activa el senyal i agafa el material.'),
  signalDone: T('Pitada larga: tu compañero activa el 112 y trae el DESA.', 'Xiulada llarga: el teu company activa el 112 i porta el DESA.'),
  partnerHere: T('Tu compañero ha llegado al borde.', 'El teu company ha arribat a la vora.'),
  desaHere: T('El DESA está en el borde.', 'El DESA està en la vora.'),
  tookTube: T('Tubo de rescate cogido.', 'Tub de rescat agafat.'), tookBuoy: T('Boya torpedo cogida.', 'Boia torpede agafada.'),
  victimSank: T('La víctima se ha agotado y se ha sumergido.', 'La víctima s\'ha esgotat i s\'ha submergit.'),
  convulsionsStopped: T('Las contracciones han cesado: ahora puedes extraer.', 'Les contraccions han cessat: ara pots extraure.'),
  o2zero: T('Reserva de oxígeno agotada: cada segundo cuenta.', 'Reserva d\'oxigen esgotada: cada segon compta.'),
  noTubeWarn: T('Has entrado sin material.', 'Has entrat sense material.'),
  entryTitle: T('¿Cómo entras al agua?', 'Com entres a l\'aigua?'),
  entryGiant: T('Paso de gigante con el material, sin perder de vista a la víctima', 'Pas de gegant amb el material, sense perdre de vista la víctima'),
  entryDive: T('En picado desde el bordillo', 'En picat des de la vorera'),
  critDivePool: T('Picado en piscina: te has lesionado la columna. El rescate termina aquí.', 'Picat en piscina: t\'has lesionat la columna. El rescat acaba ací.'),
  entryHole: T('De cabeza en agujero', 'De cap en forat'),
  entryHoleWhy: T('Pierdes de vista a la víctima; la entrada en agujero exige 2 m de profundidad y no es la indicada aquí.', 'Perds de vista la víctima; l\'entrada en forat exigix 2 m de profunditat i no és la indicada ací.'),
  entryRun: T('Entrar corriendo y nadar con la cabeza fuera', 'Entrar corrent i nedar amb el cap fora'),
  entryDiveWave: T('Zambullida de cabeza contra la ola', 'Capbussada de cap contra l\'ona'),
  critDiveBeach: T('Zambullida en aguas poco profundas: lesión medular propia. El rescate termina aquí.', 'Capbussada en aigües poc profundes: lesió medul·lar pròpia. El rescat acaba ací.'),
  entryBack: T('Volver a por el material', 'Tornar a per el material'),
  contactTitle: T('Llegas a la víctima. ¿Qué haces?', 'Arribes a la víctima. Què fas?'),
  cTurnAirway: T('Girarla boca arriba, material por delante, vías aéreas fuera del agua', 'Girar-la boca amunt, material per davant, vies aèries fora de l\'aigua'),
  cTowFaceDown: T('Remolcarla boca abajo tirando del bañador', 'Remolcar-la boca avall tirant del banyador'),
  critFaceDown: T('Remolque boca abajo: vías aéreas sumergidas todo el trayecto.', 'Remolc boca avall: vies aèries submergides tot el trajecte.'),
  cMouthHere: T('Soltar el tubo y hacer el boca a boca aquí', 'Soltar el tub i fer el boca a boca ací'),
  cMouthHereWhy: T('Sin material clicado y con el borde cerca, pierdes segundos preciosos.', 'Sense material clicat i amb la vora prop, perds segons preciosos.'),
  cTubeFront: T('Ofrecer el material por delante y ganar su espalda', 'Oferir el material per davant i guanyar la seua esquena'),
  cFrontal: T('Sujetarla de frente cuerpo a cuerpo', 'Subjectar-la de front cos a cos'),
  cFrontalNoTube: T('Acercarte de frente sin material', 'Acostar-te de front sense material'),
  critGrab: T('Agarre de pánico: te hunde y tienes que zafarte.', 'Agafada de pànic: t\'enfonsa i has de zafar-te.'),
  cWaitTired: T('Esperar a distancia a que se agote', 'Esperar a distància que s\'esgote'),
  cWaitTiredWhy: T('Puede sumergirse en cualquier momento; pierdes tiempo.', 'Pot submergir-se en qualsevol moment; perds temps.'),
  cBicepsTriceps: T('Bíceps-tríceps y golpe de riñón manteniendo el eje; vías fuera', 'Bíceps-tríceps i colp de ronyó mantenint l\'eix; vies fora'),
  cHeadOneHand: T('Girarla agarrando la cabeza con una mano', 'Girar-la agafant el cap amb una mà'),
  critHead: T('Rotación del cuello sin control del eje.', 'Rotació del coll sense control de l\'eix.'),
  cHoldConv: T('Mantener las vías aéreas fuera, cabeza ladeada, y esperar a que cesen', 'Mantindre les vies aèries fora, cap de costat, i esperar que cessen'),
  cExtractNow: T('Extraerlo ya, en plena crisis', 'Extraure\'l ja, en plena crisi'),
  cExtractNowWhy: T('Se espera a que cesen las contracciones antes de extraer.', 'S\'espera que cessen les contraccions abans d\'extraure.'),
  cMouthObj: T('Meterle el tubo en la boca para que no se muerda', 'Ficar-li el tub en la boca perquè no es mossegue'),
  critMouth: T('Nunca objetos en la boca durante una crisis.', 'Mai objectes en la boca durant una crisi.'),
  holdingConv: T('Mantienes el control hasta que cesen las sacudidas.', 'Mantens el control fins que cessen les sacsejades.'),
  controlOk: T('Víctima controlada. Remolca hasta el borde más cercano.', 'Víctima controlada. Remolca fins a la vora més pròxima.'),
  lmBreathTitle: T('No respira. ¿Y ahora?', 'No respira. I ara?'),
  lmExtractNow: T('Extracción inmediata manteniendo la alineación', 'Extracció immediata mantenint l\'alineació'),
  lmWaitBoard: T('Esperar en el agua al collarín y al tablero', 'Esperar en l\'aigua el collarí i el tauler'),
  critWaitBoard: T('Sin ventilación cada minuto es daño cerebral: la vida antes que la columna.', 'Sense ventilació cada minut és dany cerebral: la vida abans que la columna.'),
  lmExtractWhy: T('Correcto: si no se puede asegurar la ventilación, extracción inmediata.', 'Correcte: si no es pot assegurar la ventilació, extracció immediata.'),
  waitConv: T('Sigue convulsionando: espera a que cesen antes de extraer.', 'Continua convulsionant: espera que cessen abans d\'extraure.'),
  extractTitle: T('En el borde. ¿Cómo la extraes?', 'En la vora. Com l\'extraus?'),
  extractWithPartner: T('Extracción con el compañero: flexionando las piernas, tumbada boca arriba', 'Extracció amb el company: flexionant les cames, gitada boca amunt'),
  extractAlone: T('Extracción sola (tardarás más)', 'Extracció sola (tardaràs més)'),
  extractWait: T('Esperar al compañero en el agua', 'Esperar el company en l\'aigua'),
  extractSit: T('Sentarla en el bordillo para que escupa el agua', 'Asseure-la en la vorera perquè escupa l\'aigua'),
  critSit: T('No respira: sentarla retrasa la reanimación y favorece el vómito.', 'No respira: asseure-la retarda la reanimació i afavorix el vòmit.'),
  extracting: T('Extrayendo…', 'Extraient…'),
  goToEdge: T('Lleva a la víctima hasta el borde para extraerla.', 'Porta la víctima fins a la vora per a extraure-la.'),
  nothingHere: T('Nada que hacer aquí.', 'Res a fer ací.'),
  ripLabel: T('corriente de retorno', 'corrent de retorn'), riaLabel: T('¡RIA!', 'RIA!'),
  o2: T('O₂', 'O₂'), fatigue: T('Flotación', 'Flotació'), temp: T('Temperatura', 'Temperatura'),
  noSignal: T('Sin señal de rescate: nadie viene', 'Sense senyal de rescat: ningú ve'), partner: T('Compañero', 'Company'),
  timeout: T('Se ha agotado el tiempo de decisión.', 'S\'ha esgotat el temps de decisió.'),
  pcrConscTitle: T('Fuera del agua. Primero…', 'Fora de l\'aigua. Primer…'),
  pcrConscOk: T('Comprobar consciencia: sacudir los hombros y preguntar', 'Comprovar consciència: sacsejar els muscles i preguntar'),
  pcrConscOkWhy: T('No responde. La valoración empieza por la consciencia.', 'No respon. La valoració comença per la consciència.'),
  pcrConscCompress: T('Compresiones torácicas ya', 'Compressions toràciques ja'),
  pcrConscCompressWhy: T('Sin valorar consciencia y respiración no sabes si hay parada.', 'Sense valorar consciència i respiració no saps si hi ha parada.'),
  pcrConscHeimlich: T('Heimlich para sacar el agua', 'Heimlich per a traure l\'aigua'),
  critHeimlich: T('Ineficaz, retrasa la RCP y provoca vómito con aspiración.', 'Ineficaç, retarda l\'RCP i provoca vòmit amb aspiració.'),
  pcrConscPLS: T('Posición lateral de seguridad', 'Posició lateral de seguretat'),
  critPLS: T('PLS en alguien que no respira: no estás reanimando.', 'PLS en algú que no respira: no estàs reanimant.'),
  pcrHelpTitle: T('No responde. ¿Y la ayuda?', 'No respon. I l\'ajuda?'),
  pcrHelpOk: T('Gritar pidiendo ayuda: que tu compañero active el 112 y traiga el DESA', 'Cridar demanant ajuda: que el teu company active el 112 i porte el DESA'),
  pcrHelpOkWhy: T('Correcto: DESA y 112 en marcha mientras tú empiezas.', 'Correcte: DESA i 112 en marxa mentre tu comences.'),
  pcrHelpNone: T('Empezar sin avisar a nadie', 'Començar sense avisar ningú'),
  pcrHelpNoneWhy: T('Sin aviso, el DESA tarda mucho más.', 'Sense avís, el DESA tarda molt més.'),
  pcrHelpGo: T('Ir tú a por el DESA y dejar a la víctima', 'Anar tu a per el DESA i deixar la víctima'),
  pcrHelpGoWhy: T('Con gente alrededor, delega: tú no te separas de la víctima.', 'Amb gent al voltant, delega: tu no et separes de la víctima.'),
  pcrAirwayTitle: T('A: abrir la vía aérea', 'A: obrir la via aèria'),
  airHeadTiltCerv: T('Frente-mentón con control cervical', 'Front-mentó amb control cervical'),
  airHeadTiltCervWhy: T('Correcto: en el medio acuático la A siempre lleva control cervical.', 'Correcte: en el medi aquàtic la A sempre porta control cervical.'),
  airHyper: T('Hiperextensión máxima del cuello', 'Hiperextensió màxima del coll'),
  airHyperWhy: T('Sin control del eje; si hubiera lesión cervical la agravas.', 'Sense control de l\'eix; si hi haguera lesió cervical l\'agreuges.'),
  airGuedelFirst: T('Colocar la cánula de Guedel antes de comprobar la respiración', 'Col·locar la cànula de Guedel abans de comprovar la respiració'),
  airGuedelWhy: T('Primero la valoración; la cánula es apoyo instrumental después.', 'Primer la valoració; la cànula és suport instrumental després.'),
  airJaw: T('Tracción mandibular sin mover el cuello', 'Tracció mandibular sense moure el coll'),
  airJawWhy: T('Correcto: sospecha clara de lesión cervical.', 'Correcte: sospita clara de lesió cervical.'),
  airHeadTilt: T('Frente-mentón', 'Front-mentó'),
  airHeadTiltLmWhy: T('Zambullida contra una ola: con sospecha de lesión cervical, tracción mandibular.', 'Capbussada contra una ona: amb sospita de lesió cervical, tracció mandibular.'),
  vosTitle: T('B: Ver, Oír, Sentir', 'B: Veure, Oir, Sentir'),
  vosHint: T('Mantén pulsado mientras compruebas la respiración y suelta antes de 10 segundos.', 'Mantín polsat mentre comproves la respiració i solta abans de 10 segons.'),
  vosBtn: T('Ver, oír, sentir (mantener)', 'Veure, oir, sentir (mantindre)'),
  vosTooLong: T('Más de 10 segundos: cada segundo de más es hipoxia. No respira; solo boquea.', 'Més de 10 segons: cada segon de més és hipòxia. No respira; només boqueja.'),
  vosTooShort: T('Demasiado rápido para valorar. No respira; solo boquea.', 'Massa ràpid per a valorar. No respira; només boqueja.'),
  vosResult: T('No respira; solo boquea (gasping). Se trata como parada.', 'No respira; només boqueja (gasping). Es tracta com a parada.'),
  pcrStartTitle: T('No respira. ¿Cómo empiezas?', 'No respira. Com comences?'),
  startFive: T('5 insuflaciones de rescate iniciales', '5 insuflacions de rescat inicials'),
  startFiveWhy: T('Correcto: en el ahogado, 5 insuflaciones antes de las compresiones.', 'Correcte: en l\'ofegat, 5 insuflacions abans de les compressions.'),
  startFiveLandWhy: T('Las 5 insuflaciones son para el ahogado y el niño; aquí 30:2 directo.', 'Les 5 insuflacions són per a l\'ofegat i el xiquet; ací 30:2 directe.'),
  startCompress: T('30 compresiones y 2 ventilaciones, directamente', '30 compressions i 2 ventilacions, directament'),
  startCompressWhy: T('En el ahogado se empieza con 5 insuflaciones.', 'En l\'ofegat es comença amb 5 insuflacions.'),
  startCompressWhy2: T('Correcto: parada de origen cardíaco en el adulto, 30:2 desde el principio.', 'Correcte: parada d\'origen cardíac en l\'adult, 30:2 des del principi.'),
  startTwo: T('2 insuflaciones y luego 30:2', '2 insuflacions i després 30:2'),
  startTwoWhy: T('Son 5 iniciales en el ahogado.', 'Són 5 inicials en l\'ofegat.'),
  startDrain: T('Compresiones abdominales para drenar el agua', 'Compressions abdominals per a drenar l\'aigua'),
  critDrain: T('Ineficaces y peligrosas: retrasan la RCP y provocan aspiración.', 'Ineficaces i perilloses: retarden l\'RCP i provoquen aspiració.'),
  startPLS: T('Posición lateral de seguridad y esperar al DESA', 'Posició lateral de seguretat i esperar el DESA'),
  ventTitle5: T('5 insuflaciones de rescate', '5 insuflacions de rescat'), ventTitle2: T('2 ventilaciones', '2 ventilacions'),
  ventHint: T('Mantén pulsado para insuflar y suelta cuando el tórax se eleve ligeramente (zona verde). Demasiado volumen provoca regurgitación.', 'Mantín polsat per a insuflar i solta quan el tòrax s\'eleve lleugerament (zona verda). Massa volum provoca regurgitació.'),
  ventBtn: T('Insuflar (mantener)', 'Insuflar (mantindre)'),
  ventTooMuch: T('Demasiado volumen: regurgita. Pierdes segundos.', 'Massa volum: regurgita. Perds segons.'),
  ventTooLittle: T('Insuflación ineficaz: no se eleva el tórax.', 'Insuflació ineficaç: no s\'eleva el tòrax.'),
  ventDone: T('Insuflaciones eficaces. Sigue sin respirar: compresiones.', 'Insuflacions eficaces. Continua sense respirar: compressions.'),
  cprTitle: T('RCP 30:2', 'RCP 30:2'), cycle: T('ciclo', 'cicle'),
  cprHint: T('Pulsa al ritmo de 100-120 por minuto siguiendo la aguja; tras 30 compresiones, 2 ventilaciones.', 'Polsa al ritme de 100-120 per minut seguint l\'agulla; després de 30 compressions, 2 ventilacions.'),
  cprBtn: T('Comprimir', 'Comprimir'),
  useDesa: T('Usar el DESA', 'Usar el DESA'),
  desaComing: T('El DESA viene de camino; sigue comprimiendo.', 'El DESA ve de camí; continua comprimint.'),
  desaTitle: T('DESA', 'DESA'),
  desaHint: T('Prepara el tórax y arrastra los parches a su sitio: 1 bajo la clavícula derecha, 2 bajo la axila izquierda.', 'Prepara el tòrax i arrossega els pegats al seu lloc: 1 davall la clavícula dreta, 2 davall l\'aixella esquerra.'),
  prepMoveSand: T('Apartar de la zona mojada', 'Apartar de la zona mullada'),
  prepDryFloor: T('Mover a zona seca', 'Moure a zona seca'),
  prepDryChest: T('Secar el tórax', 'Assecar el tòrax'),
  prepSand: T('Retirar la arena', 'Retirar l\'arena'),
  rightSide: T('dcha.', 'dreta'), leftSide: T('izda.', 'esq.'),
  padNoStick: T('El parche no se adhiere: seca el tórax (y retira la arena).', 'El pegat no s\'adherix: asseca el tòrax (i retira l\'arena).'),
  padHint1: T('Parche 1: bajo la clavícula derecha de la víctima.', 'Pegat 1: davall la clavícula dreta de la víctima.'),
  padHint2: T('Parche 2: bajo la axila izquierda, a unos 10 cm.', 'Pegat 2: davall l\'aixella esquerra, a uns 10 cm.'),
  desaAnalysing: T('Analizando el ritmo… no toques a la víctima.', 'Analitzant el ritme… no toques la víctima.'),
  desaShockAdvised: T('Descarga aconsejada.', 'Descàrrega aconsellada.'),
  allClear: T('¡Todos fuera! Descargar', 'Tots fora! Descarregar'),
  wetWarning: T('La víctima sigue sobre suelo mojado.', 'La víctima continua sobre terra mullada.'),
  critWetShock: T('Descarga sobre suelo mojado: riesgo eléctrico para todos.', 'Descàrrega sobre terra mullada: risc elèctric per a tots.'),
  shockDone: T('Descarga realizada. Reanuda la RCP inmediatamente.', 'Descàrrega realitzada. Reprén l\'RCP immediatament.'),
  afterTitle: T('Recupera respiración y pulso. ¿Qué haces?', 'Recupera respiració i pols. Què fas?'),
  afterPLS: T('PLS, manta térmica con el dorado hacia fuera y reevaluación constante', 'PLS, manta tèrmica amb el daurat cap a fora i reavaluació constant'),
  afterPLSWhy: T('Correcto: respira pero está inconsciente; sale mojada y pierde calor.', 'Correcte: respira però està inconscient; ix mullada i perd calor.'),
  afterSupineCerv: T('Decúbito supino con control cervical, abrigar, inmovilizar cuando llegue el material', 'Decúbit supí amb control cervical, abrigar, immobilitzar quan arribe el material'),
  afterSupineCervWhy: T('Correcto: con sospecha de lesión medular no se hace PLS.', 'Correcte: amb sospita de lesió medul·lar no es fa PLS.'),
  critPLSLm: T('PLS con sospecha de lesión medular: contraindicada.', 'PLS amb sospita de lesió medul·lar: contraindicada.'),
  afterDrink: T('Darle agua para que se recupere', 'Donar-li aigua perquè es recupere'),
  critDrink: T('Nada por boca a quien no está plenamente consciente.', 'Res per boca a qui no està plenament conscient.'),
  afterLeave: T('Dejarla para ir a buscar al SVA', 'Deixar-la per a anar a buscar el SVA'),
  afterLeaveWhy: T('Nunca se deja sola a la víctima.', 'Mai es deixa sola la víctima.'),
  resultTitle: T('Resultado de la simulación', 'Resultat de la simulació'),
  totalTime: T('Tiempo', 'Temps'), wrongCount: T('fallos', 'errades'),
  reviewProtocol: T('Repasar el protocolo', 'Repassar el protocol'),
  resInjured: T('Te has lesionado al entrar: sin socorrista no hay rescate.', 'T\'has lesionat en entrar: sense socorrista no hi ha rescat.'),
  resO2zero: T('La reserva de oxígeno llegó a cero antes de ventilar.', 'La reserva d\'oxigen va arribar a zero abans de ventilar.'),
  resCprBad: T('Ritmo de compresiones fuera de 100-120/min la mayor parte del tiempo.', 'Ritme de compressions fora de 100-120/min la major part del temps.'),
  resCprMeh: T('Ritmo de compresiones irregular.', 'Ritme de compressions irregular.'),
  resCprGood: T('Buen ritmo de compresiones.', 'Bon ritme de compressions.'),
  resNoDesaNoSignal: T('Sin señal de rescate el DESA nunca llegó.', 'Sense senyal de rescat el DESA mai va arribar.'),
  resNoDesa: T('No se usó el DESA.', 'No es va usar el DESA.'),
  resVentFails: T('Insuflaciones con regurgitación:', 'Insuflacions amb regurgitació:'),
  resFirstVent: T('Primera ventilación eficaz a los', 'Primera ventilació eficaç als'),
  resCold: T('La víctima se enfrió demasiado: abriga antes.', 'La víctima es va refredar massa: abriga abans.'),
  resNoSignal: T('No activaste la señal de rescate en marcha.', 'No vas activar el senyal de rescat en marxa.'),
  outInjured: T('Rescate fallido: el socorrista lesionado se convierte en una segunda víctima.', 'Rescat fallit: el socorrista lesionat es convertix en una segona víctima.'),
  outRosc: T('La víctima recupera pulso y respiración antes de que llegue el SVA.', 'La víctima recupera pols i respiració abans que arribe el SVA.'),
  outRelay: T('Llega el SVA y os releva; continúan la reanimación con soporte avanzado.', 'Arriba el SVA i vos releva; continuen la reanimació amb suport avançat.'),
  outStable: T('La víctima llega estable a la transferencia con el SVA.', 'La víctima arriba estable a la transferència amb el SVA.'),
  outHarm: T('Una de tus acciones ha causado daño a la víctima. En el examen de la FSSCV eso invalida la prueba.', 'Una de les teues accions ha causat dany a la víctima. En l\'examen de la FSSCV això invalida la prova.')
};

/* ---------- Simulación 3D (sustituye textos de la 2D) ---------- */
UI.game.title = T('Simulación 3D en primera persona', 'Simulació 3D en primera persona');
UI.game.intro = T('Ves con tus ojos: tus brazos, el tubo de rescate, el agua y la víctima. Activas la señal, coges el material, entras, nadas con la cabeza fuera sin perderla de vista, la controlas, la remolcas y la extraes. Después vienen los primeros auxilios con los mini-juegos de técnica. La víctima empeora mientras tardas.',
                  'Veus amb els teus ulls: els teus braços, el tub de rescat, l\'aigua i la víctima. Actives el senyal, agafes el material, entres, nedes amb el cap fora sense perdre-la de vista, la controles, la remolques i l\'extraus. Després vénen els primers auxilis amb els minijocs de tècnica. La víctima empitjora mentre tardes.');
UI.game.controls = T('Ordenador: W/S o ↑/↓ para avanzar y retroceder, A/D para desplazarte, ←/→ o arrastrar con el ratón para mirar, espacio o E para actuar, X para la señal. Móvil: joystick a la izquierda para moverte, arrastra en la pantalla para mirar y botón rojo para actuar.',
                     'Ordinador: W/S o ↑/↓ per a avançar i retrocedir, A/D per a desplaçar-te, ←/→ o arrossegar amb el ratolí per a mirar, espai o E per a actuar, X per al senyal. Mòbil: joystick a l\'esquerra per a moure\'t, arrossega en la pantalla per a mirar i botó roig per a actuar.');
UI.game.briefWater = T('Empiezas en el puesto de vigilancia mirando hacia la víctima. El tubo de rescate está en el suelo, a tus pies: camina por encima para cogerlo. La marca sobre la víctima indica la distancia; si la pierdes de vista, gira hasta volver a encontrarla. Señal de rescate en marcha: botón del silbato o tecla X.',
                       'Comences en el lloc de vigilància mirant cap a la víctima. El tub de rescat està en terra, als teus peus: camina per damunt per a agafar-lo. La marca sobre la víctima indica la distància; si la perds de vista, gira fins a tornar a trobar-la. Senyal de rescat en marxa: botó del xiulet o tecla X.');
UI.game.lookHint = T('Arrastra para mirar · muévete hacia el agua para entrar', 'Arrossega per a mirar · mou-te cap a l\'aigua per a entrar');
UI.game.noThree = T('No se ha podido cargar el motor 3D (Three.js). Comprueba la conexión y recarga la página.', 'No s\'ha pogut carregar el motor 3D (Three.js). Comprova la connexió i recarrega la pàgina.');
UI.game.noWebgl = T('Este navegador o dispositivo no permite gráficos 3D (WebGL). Prueba con otro navegador.', 'Este navegador o dispositiu no permet gràfics 3D (WebGL). Prova amb un altre navegador.');

/* ---------- Primeros auxilios y extracción en 3D ---------- */
UI.game.p3Hear = T('«¡Eh! ¿Me oye? ¿Se encuentra bien?»', '«Eh! Em sent? Es troba bé?»');
UI.game.p3NoResp = T('No responde.', 'No respon.');
UI.game.p3ExtractPartner = T('Tu compañero la sujeta por las muñecas desde el borde mientras tú la empujas desde el agua, sin flexionar el tronco.', 'El teu company la subjecta pels canells des de la vora mentre tu l\'espentes des de l\'aigua, sense flexionar el tronc.');
UI.game.p3ExtractAlone = T('Sales del agua sin soltarla, le cruzas las muñecas y la subes por el bordillo flexionando tus piernas.', 'Ixes de l\'aigua sense soltar-la, li creues els canells i la puges per la vorera flexionant les teues cames.');
UI.game.p3ExtractBeach = T('La arrastras sujetándola por las axilas hasta la arena seca, fuera del alcance de las olas.', 'L\'arrossegues subjectant-la per les aixelles fins a l\'arena seca, fora de l\'abast de les ones.');
UI.game.p3ExtractBeachLm = T('La sacas hasta la arena seca sujetándola por las axilas y manteniendo la cabeza alineada con el cuerpo.', 'La traus fins a l\'arena seca subjectant-la per les aixelles i mantenint el cap alineat amb el cos.');
UI.game.desaHint = T('Prepara a la víctima y toca su pecho donde va cada parche: primero bajo la clavícula derecha (la que tienes más cerca) y después bajo la axila izquierda.', 'Prepara la víctima i toca el seu pit on va cada pegat: primer davall la clavícula dreta (la que tens més prop) i després davall l\'aixella esquerra.');
UI.game.cprHint = T('Pulsa el botón (o la barra espaciadora) al ritmo de la aguja: 100-120 por minuto. Tras 30 compresiones, 2 ventilaciones.', 'Polsa el botó (o la barra espaiadora) al ritme de l\'agulla: 100-120 per minut. Després de 30 compressions, 2 ventilacions.');
UI.game.ventHint = T('Mantén pulsado (o la barra espaciadora) para insuflar y suelta cuando el tórax se eleve ligeramente: zona verde. Demasiado volumen provoca regurgitación.', 'Mantín polsat (o la barra espaiadora) per a insuflar i solta quan el tòrax s\'eleve lleugerament: zona verda. Massa volum provoca regurgitació.');
UI.game.vosHint = T('Acercas la mejilla a su boca mirando el pecho. Mantén pulsado (o la barra espaciadora) mientras valoras y suelta antes de 10 segundos.', 'Acostes la galta a la seua boca mirant el pit. Mantín polsat (o la barra espaiadora) mentre valores i solta abans de 10 segons.');
